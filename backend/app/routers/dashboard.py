"""Aggregated Dashboard endpoint (Roadmap Phase 13 & 58)."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.exam import Exam
from app.models.assignment import Assignment
from app.models.study_session import StudySession
from app.schemas.dashboard import DashboardSummary
from app.schemas.study_plan import StudySessionRead
from app.schemas.exam import ExamRead
from app.schemas.assignment import AssignmentRead
from app.services.analytics import get_subject_analytics, calculate_study_deficit, detect_weak_subjects

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    """Return comprehensive aggregated academic dashboard data."""
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())

    # 1. Subject Analytics and Overall Progress
    _, overall_progress = get_subject_analytics(db, current_user.id)

    # 2. Study hours this week (actual vs planned)
    week_sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == current_user.id, StudySession.scheduled_start >= week_start)
        .all()
    )
    actual_hours = sum(s.actual_minutes for s in week_sessions if s.status == "COMPLETED") / 60.0
    planned_hours = (
        sum(int((s.scheduled_end - s.scheduled_start).total_seconds() / 60) for s in week_sessions) / 60.0
    )

    # 3. Tasks counts
    all_topics = (
        db.query(Topic)
        .join(Subject, Topic.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == current_user.id)
        .all()
    )
    pending_tasks = sum(1 for t in all_topics if t.status != "COMPLETED")
    completed_tasks = sum(1 for t in all_topics if t.status == "COMPLETED")

    # 4. Upcoming exams & assignments (next 30 days)
    horizon_30 = now + timedelta(days=30)
    upcoming_exams_records = (
        db.query(Exam)
        .join(Subject, Exam.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == current_user.id, Exam.exam_date >= now, Exam.exam_date <= horizon_30)
        .order_by(Exam.exam_date.asc())
        .all()
    )
    upcoming_assignments_records = (
        db.query(Assignment)
        .join(Subject, Assignment.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == current_user.id, Assignment.deadline >= now, Assignment.deadline <= horizon_30)
        .order_by(Assignment.deadline.asc())
        .all()
    )

    # 5. Today's sessions
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    today_sess = (
        db.query(StudySession)
        .filter(StudySession.user_id == current_user.id, StudySession.scheduled_start >= today_start, StudySession.scheduled_start < today_end)
        .order_by(StudySession.scheduled_start.asc())
        .all()
    )
    today_reads = []
    for s in today_sess:
        sr = StudySessionRead.model_validate(s)
        sr.subject_name = s.subject.name if s.subject else None
        sr.topic_name = s.topic.name if s.topic else None
        today_reads.append(sr)

    # 6. Weak subjects & Deficit
    weak_subjs = detect_weak_subjects(db, current_user.id)
    deficit = calculate_study_deficit(db, current_user.id, days_horizon=7)

    # 7. Recent activity
    recent_activity = [
        f"Generated adaptive schedule with {len(today_sess)} sessions today",
        f"Tracked {round(actual_hours, 1)} study hours this week",
    ]

    return DashboardSummary(
        overall_progress=overall_progress,
        study_hours_this_week=round(actual_hours, 1),
        study_hours_planned_this_week=round(planned_hours, 1),
        pending_tasks_count=pending_tasks,
        completed_tasks_count=completed_tasks,
        upcoming_exams=[ExamRead.model_validate(e) for e in upcoming_exams_records],
        upcoming_assignments=[AssignmentRead.model_validate(a) for a in upcoming_assignments_records],
        today_sessions=today_reads,
        weak_subjects=weak_subjs,
        study_deficit=deficit,
        recent_activity=recent_activity,
    )
