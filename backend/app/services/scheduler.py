"""Deterministic Study Scheduling Engine & Adaptive Rescheduler.

Implements Roadmap Phase 10 & 12 (Sections 27-33):
- Prioritizes incomplete topics and assignments
- Allocates topics into student availability slots
- Splits long tasks across multiple sessions
- Reserves revision slots before upcoming exams
- Reschedules dynamically on missed or completed sessions
"""

from datetime import datetime, timedelta, timezone, time
from typing import List
from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.exam import Exam
from app.models.assignment import Assignment
from app.models.availability import StudyAvailability
from app.models.study_plan import StudyPlan
from app.models.study_session import StudySession
from app.services.priority import calculate_topic_priority


def get_student_time_slots(db: Session, user_id: int, start_date: datetime, days_ahead: int = 7) -> list[dict]:
    """Return concrete datetime slots for the user over the next days_ahead days."""
    avail_records = db.query(StudyAvailability).filter(StudyAvailability.user_id == user_id).all()

    # If student has not set custom availability yet, default to 2 hours every evening (18:00 - 20:00)
    avail_by_day = {}
    if avail_records:
        for a in avail_records:
            avail_by_day.setdefault(a.day_of_week, []).append(a)
    else:
        # Default slots Monday through Sunday 18:00 to 20:00
        pass

    slots = []
    base_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

    for d in range(days_ahead):
        cur_date = base_date + timedelta(days=d)
        weekday = cur_date.weekday()  # 0=Monday, 6=Sunday

        if weekday in avail_by_day:
            for rec in avail_by_day[weekday]:
                try:
                    s_parts = [int(p) for p in rec.start_time.split(":")]
                    e_parts = [int(p) for p in rec.end_time.split(":")]
                    start_dt = cur_date.replace(hour=s_parts[0], minute=s_parts[1])
                    end_dt = cur_date.replace(hour=e_parts[0], minute=e_parts[1])
                    if end_dt > start_dt and end_dt > start_date:
                        slots.append({
                            "start": max(start_dt, start_date),
                            "end": end_dt,
                            "minutes": int((end_dt - max(start_dt, start_date)).total_seconds() / 60),
                        })
                except Exception:
                    continue
        else:
            # Fallback default: 18:00 - 20:00
            start_dt = cur_date.replace(hour=18, minute=0)
            end_dt = cur_date.replace(hour=20, minute=0)
            if end_dt > start_dt and end_dt > start_date:
                slots.append({
                    "start": max(start_dt, start_date),
                    "end": end_dt,
                    "minutes": int((end_dt - max(start_dt, start_date)).total_seconds() / 60),
                })

    # Sort slots chronologically
    slots.sort(key=lambda s: s["start"])
    return slots


def generate_study_plan(
    db: Session,
    user_id: int,
    classroom_id: int | None = None,
    days_ahead: int = 7,
    reason: str = "Initial plan generation",
) -> StudyPlan:
    """Generate and persist a structured, deterministic study schedule."""
    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(days=days_ahead)

    # 1. Fetch academic subjects belonging to user
    subj_query = db.query(Subject).join(Classroom, Subject.classroom_id == Classroom.id).filter(Classroom.user_id == user_id)
    if classroom_id:
        subj_query = subj_query.filter(Classroom.id == classroom_id)
    subjects = subj_query.all()
    subject_map = {s.id: s for s in subjects}

    if not subjects:
        # Create an empty plan if no subjects exist yet
        plan = StudyPlan(
            user_id=user_id,
            classroom_id=classroom_id,
            generated_at=now,
            valid_from=now,
            valid_until=valid_until,
            version=1,
            reason="No subjects found; placeholder plan",
            status="ACTIVE",
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    subj_ids = [s.id for s in subjects]

    # 2. Fetch exams and upcoming assignments
    exams = db.query(Exam).filter(Exam.subject_id.in_(subj_ids), Exam.exam_date >= now).order_by(Exam.exam_date.asc()).all()
    nearest_exam_by_subject = {}
    for ex in exams:
        if ex.subject_id not in nearest_exam_by_subject:
            nearest_exam_by_subject[ex.subject_id] = ex

    # 3. Fetch incomplete topics
    topics = db.query(Topic).filter(Topic.subject_id.in_(subj_ids), Topic.status != "COMPLETED").all()

    # 4. Score topics with Priority Engine
    scored_topics = []
    for t in topics:
        exam = nearest_exam_by_subject.get(t.subject_id)
        score = calculate_topic_priority(
            topic=t,
            nearest_exam_date=exam.exam_date if exam else None,
            exam_weightage=exam.weightage if exam else 50.0,
        )
        scored_topics.append({"topic": t, "priority": score, "remaining_minutes": int(t.estimated_minutes * (1.0 - (t.progress_percentage / 100.0)))})

    # Sort topics by priority descending
    scored_topics.sort(key=lambda item: item["priority"], reverse=True)

    # 5. Fetch previous plan to determine version number
    prev_plan = db.query(StudyPlan).filter(StudyPlan.user_id == user_id, StudyPlan.status == "ACTIVE").order_by(StudyPlan.version.desc()).first()
    version = (prev_plan.version + 1) if prev_plan else 1

    if prev_plan:
        prev_plan.status = "SUPERSEDED"

    # 6. Create new active StudyPlan record
    new_plan = StudyPlan(
        user_id=user_id,
        classroom_id=classroom_id,
        generated_at=now,
        valid_from=now,
        valid_until=valid_until,
        version=version,
        reason=reason,
        status="ACTIVE",
    )
    db.add(new_plan)
    db.flush()

    # 7. Get available study time slots
    slots = get_student_time_slots(db, user_id, now, days_ahead)

    # 8. Allocate sessions
    sessions_to_create = []

    # Check for upcoming exams within 48h to reserve revision
    for ex in exams:
        ex_dt = ex.exam_date
        if ex_dt.tzinfo is None:
            ex_dt = ex_dt.replace(tzinfo=timezone.utc)
        hours_until_exam = (ex_dt - now).total_seconds() / 3600.0
        if 0 < hours_until_exam <= 48:
            # Find first available slot before exam for revision
            for slot in slots:
                if slot["start"] < ex_dt and slot["minutes"] >= 30:
                    rev_duration = min(60, slot["minutes"])
                    rev_end = slot["start"] + timedelta(minutes=rev_duration)
                    sessions_to_create.append(
                        StudySession(
                            user_id=user_id,
                            subject_id=ex.subject_id,
                            topic_id=None,
                            plan_id=new_plan.id,
                            session_type="REVISION",
                            scheduled_start=slot["start"],
                            scheduled_end=rev_end,
                            status="PLANNED",
                        )
                    )
                    slot["start"] = rev_end + timedelta(minutes=10)
                    slot["minutes"] = max(0, int((slot["end"] - slot["start"]).total_seconds() / 60))
                    break

    # Allocate regular topic study blocks
    topic_idx = 0
    num_topics = len(scored_topics)

    for slot in slots:
        cur_start = slot["start"]
        rem_slot_minutes = slot["minutes"]

        while rem_slot_minutes >= 20 and num_topics > 0:
            item = scored_topics[topic_idx % num_topics]
            topic = item["topic"]
            task_minutes = item["remaining_minutes"]

            # Max single session duration is 90 minutes to prevent burnout
            session_len = min(task_minutes, rem_slot_minutes, 90)
            if session_len < 20:
                session_len = min(rem_slot_minutes, 30)

            cur_end = cur_start + timedelta(minutes=session_len)

            sessions_to_create.append(
                StudySession(
                    user_id=user_id,
                    subject_id=topic.subject_id,
                    topic_id=topic.id,
                    plan_id=new_plan.id,
                    session_type="STUDY",
                    scheduled_start=cur_start,
                    scheduled_end=cur_end,
                    status="PLANNED",
                )
            )

            item["remaining_minutes"] = max(0, item["remaining_minutes"] - session_len)
            cur_start = cur_end + timedelta(minutes=10)  # 10 min break buffer
            rem_slot_minutes = max(0, int((slot["end"] - cur_start).total_seconds() / 60))

            topic_idx += 1

    for s in sessions_to_create:
        db.add(s)

    db.commit()
    db.refresh(new_plan)
    return new_plan


def reschedule_adaptive(db: Session, user_id: int, reason: str = "Adaptive reschedule") -> StudyPlan:
    """Recalculate and regenerate the active plan following missed sessions or progress updates."""
    # Find current active plan
    active_plan = db.query(StudyPlan).filter(StudyPlan.user_id == user_id, StudyPlan.status == "ACTIVE").first()
    classroom_id = active_plan.classroom_id if active_plan else None

    # Automatically mark past uncompleted sessions as MISSED
    now = datetime.now(timezone.utc)
    past_sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == user_id, StudySession.status == "PLANNED", StudySession.scheduled_end < now)
        .all()
    )
    for ps in past_sessions:
        ps.status = "MISSED"

    db.commit()

    # Generate fresh plan from now onwards
    return generate_study_plan(
        db=db,
        user_id=user_id,
        classroom_id=classroom_id,
        days_ahead=7,
        reason=reason,
    )
