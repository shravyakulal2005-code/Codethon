"""Analytics, Study Deficit, and Performance Prediction Engine.

Implements Roadmap Phase 19, 20, 21 (Sections 36, 37, 48, 49, 50).
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.exam import Exam
from app.models.study_session import StudySession
from app.models.availability import StudyAvailability
from app.schemas.dashboard import WeakSubjectItem, StudyDeficitInfo
from app.schemas.analytics import SubjectAnalytics, PredictionResult, AnalyticsSummary


def calculate_subject_progress(topics: list[Topic]) -> float:
    """Calculate workload-weighted subject progress (Roadmap Section 36)."""
    if not topics:
        return 0.0
    total_minutes = sum(t.estimated_minutes for t in topics)
    if total_minutes <= 0:
        return 0.0
    weighted_prog = sum(t.progress_percentage * t.estimated_minutes for t in topics)
    return round(weighted_prog / total_minutes, 2)


def get_subject_analytics(db: Session, user_id: int) -> tuple[list[SubjectAnalytics], float]:
    """Calculate progress and analytics for all subjects owned by the user."""
    subjects = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == user_id)
        .all()
    )

    results = []
    total_workload_sum = 0
    total_weighted_progress_sum = 0.0

    for s in subjects:
        topics = s.topics
        tot_topics = len(topics)
        comp_topics = sum(1 for t in topics if t.status == "COMPLETED" or t.progress_percentage >= 100.0)
        prog = calculate_subject_progress(topics)
        tot_minutes = sum(t.estimated_minutes for t in topics)

        # Study session minutes completed for this subject
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.subject_id == s.id,
            StudySession.status == "COMPLETED",
        ).all()
        actual_minutes_done = sum(sess.actual_minutes for sess in sessions)

        results.append(
            SubjectAnalytics(
                subject_id=s.id,
                subject_name=s.name,
                total_topics=tot_topics,
                completed_topics=comp_topics,
                progress_percentage=prog,
                total_study_minutes=actual_minutes_done,
                weightage=float(tot_minutes),
            )
        )

        total_workload_sum += tot_minutes
        total_weighted_progress_sum += prog * tot_minutes

    overall_progress = (
        round(total_weighted_progress_sum / total_workload_sum, 2)
        if total_workload_sum > 0
        else 0.0
    )
    return results, overall_progress


def calculate_study_deficit(db: Session, user_id: int, days_horizon: int = 7) -> StudyDeficitInfo:
    """Calculate study deficit and recommended daily study time adjustment (Roadmap Section 48)."""
    # 1. Total remaining required study minutes
    subjects = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == user_id)
        .all()
    )
    incomplete_topics = []
    for s in subjects:
        for t in s.topics:
            if t.status != "COMPLETED":
                rem = t.estimated_minutes * (1.0 - (t.progress_percentage / 100.0))
                incomplete_topics.append(rem)

    required_minutes = int(sum(incomplete_topics))

    # 2. Total available study time over next days_horizon days
    avail_records = db.query(StudyAvailability).filter(StudyAvailability.user_id == user_id).all()
    if avail_records:
        weekly_available = sum(a.available_minutes for a in avail_records)
        available_minutes = int(weekly_available * (days_horizon / 7.0))
    else:
        # Default 2 hours / day
        available_minutes = days_horizon * 120

    deficit = max(0, required_minutes - available_minutes)
    daily_increase = int(deficit / days_horizon) if deficit > 0 else 0

    return StudyDeficitInfo(
        required_minutes=required_minutes,
        available_minutes=available_minutes,
        deficit_minutes=deficit,
        recommended_daily_increase_minutes=daily_increase,
        has_deficit=(deficit > 0),
    )


def detect_weak_subjects(db: Session, user_id: int) -> list[WeakSubjectItem]:
    """Detect weak subjects requiring extra attention (Roadmap Section 49)."""
    subjects = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == user_id)
        .all()
    )
    now = datetime.now(timezone.utc)
    weak_items = []

    for s in subjects:
        topics = s.topics
        prog = calculate_subject_progress(topics)
        avg_diff = (
            sum(t.difficulty for t in topics) / len(topics)
            if topics
            else 2.0
        )

        missed_count = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.subject_id == s.id,
            StudySession.status == "MISSED",
        ).count()

        nearest_exam = db.query(Exam).filter(
            Exam.subject_id == s.id,
            Exam.exam_date >= now,
        ).order_by(Exam.exam_date.asc()).first()

        days_to_exam = 999
        if nearest_exam:
            ex_dt = nearest_exam.exam_date
            if ex_dt.tzinfo is None:
                ex_dt = ex_dt.replace(tzinfo=timezone.utc)
            days_to_exam = (ex_dt - now).total_seconds() / 86400.0

        if prog < 40.0 and (days_to_exam <= 7 or missed_count >= 2):
            attention = "HIGH"
        elif prog < 60.0 or missed_count >= 1:
            attention = "MEDIUM"
        else:
            attention = "LOW"

        weak_items.append(
            WeakSubjectItem(
                subject_id=s.id,
                subject_name=s.name,
                progress=prog,
                difficulty_score=round(avg_diff, 1),
                missed_sessions_count=missed_count,
                attention_level=attention,
            )
        )

    # Sort so HIGH attention comes first
    order_map = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    weak_items.sort(key=lambda x: order_map.get(x.attention_level, 3))
    return weak_items


def predict_performance(db: Session, user_id: int) -> PredictionResult:
    """Predict syllabus completion probability and study velocity (Roadmap Section 50)."""
    completed_sessions = db.query(StudySession).filter(
        StudySession.user_id == user_id,
        StudySession.status == "COMPLETED",
    ).count()

    missed_sessions = db.query(StudySession).filter(
        StudySession.user_id == user_id,
        StudySession.status == "MISSED",
    ).count()

    total_tracked = completed_sessions + missed_sessions
    consistency_rate = (
        round((completed_sessions / total_tracked) * 100.0, 1)
        if total_tracked > 0
        else 85.0
    )

    # Velocity: topics completed
    completed_topics_count = (
        db.query(Topic)
        .join(Subject, Topic.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == user_id, Topic.status == "COMPLETED")
        .count()
    )
    velocity = max(1.0, float(completed_topics_count))

    # Base probability
    if total_tracked == 0:
        prob = 80.0
        verdict = "On Track (Baseline)"
        advice = "Follow your generated timetable consistently to maintain peak momentum."
    elif consistency_rate >= 80.0:
        prob = min(98.0, 75.0 + (consistency_rate * 0.2))
        verdict = "High Likelihood of Syllabus Mastery"
        advice = "Great consistency! Continue allocating dedicated revision blocks before exam dates."
    elif consistency_rate >= 50.0:
        prob = 65.0
        verdict = "Moderate Syllabus Completion"
        advice = "You have missed some planned sessions. Use the adaptive rescheduler to catch up."
    else:
        prob = 40.0
        verdict = "At Risk of Backlog"
        advice = "High missed session rate detected. Consider increasing daily study time to eliminate backlog."

    return PredictionResult(
        syllabus_completion_probability=round(prob, 1),
        velocity_topics_per_week=round(velocity, 1),
        consistency_rate=consistency_rate,
        verdict=verdict,
        advice=advice,
    )
