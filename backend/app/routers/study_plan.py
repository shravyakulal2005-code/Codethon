"""Study Plan and Session management endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.study_plan import StudyPlan
from app.models.study_session import StudySession
from app.models.topic import Topic
from app.schemas.study_plan import (
    PlanGenerateRequest,
    StudyPlanRead,
    StudySessionRead,
    SessionCompleteRequest,
    RescheduleRequest,
)
from app.services.scheduler import generate_study_plan, reschedule_adaptive

router = APIRouter(tags=["study-plan"])


def _format_plan_response(plan: StudyPlan) -> StudyPlanRead:
    """Helper to convert StudyPlan ORM object to StudyPlanRead schema."""
    sessions_read = []
    for s in plan.sessions:
        s_read = StudySessionRead.model_validate(s)
        s_read.subject_name = s.subject.name if s.subject else None
        s_read.topic_name = s.topic.name if s.topic else None
        sessions_read.append(s_read)

    plan_read = StudyPlanRead.model_validate(plan)
    plan_read.sessions = sessions_read
    return plan_read


@router.post("/classrooms/{classroom_id}/study-plan/generate", response_model=StudyPlanRead, status_code=status.HTTP_201_CREATED)
def generate_classroom_plan(
    classroom_id: int,
    payload: PlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanRead:
    """Generate deterministic study plan for a specific classroom."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    plan = generate_study_plan(
        db=db,
        user_id=current_user.id,
        classroom_id=classroom_id,
        days_ahead=payload.days_ahead,
        reason=payload.reason,
    )
    return _format_plan_response(plan)


@router.post("/study-plan/generate", response_model=StudyPlanRead, status_code=status.HTTP_201_CREATED)
def generate_overall_plan(
    payload: PlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanRead:
    """Generate personalized study plan across all classrooms."""
    plan = generate_study_plan(
        db=db,
        user_id=current_user.id,
        classroom_id=payload.classroom_id,
        days_ahead=payload.days_ahead,
        reason=payload.reason,
    )
    return _format_plan_response(plan)


@router.get("/study-plan/active", response_model=StudyPlanRead)
def get_active_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanRead:
    """Get the currently active study plan."""
    plan = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id, StudyPlan.status == "ACTIVE")
        .order_by(StudyPlan.version.desc())
        .first()
    )
    if not plan:
        # Automatically generate one on first access
        plan = generate_study_plan(db, current_user.id, days_ahead=7)

    return _format_plan_response(plan)


@router.get("/classrooms/{classroom_id}/study-plan", response_model=StudyPlanRead)
def get_classroom_active_plan(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanRead:
    """Get active plan for a specific classroom."""
    plan = (
        db.query(StudyPlan)
        .filter(
            StudyPlan.user_id == current_user.id,
            StudyPlan.classroom_id == classroom_id,
            StudyPlan.status == "ACTIVE",
        )
        .order_by(StudyPlan.version.desc())
        .first()
    )
    if not plan:
        plan = generate_study_plan(db, current_user.id, classroom_id=classroom_id, days_ahead=7)

    return _format_plan_response(plan)


@router.get("/study-sessions", response_model=list[StudySessionRead])
def list_study_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StudySessionRead]:
    """List study sessions for timetable / calendar display."""
    sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == current_user.id)
        .order_by(StudySession.scheduled_start.asc())
        .all()
    )
    results = []
    for s in sessions:
        item = StudySessionRead.model_validate(s)
        item.subject_name = s.subject.name if s.subject else None
        item.topic_name = s.topic.name if s.topic else None
        results.append(item)
    return results


@router.post("/study-sessions/{session_id}/complete", response_model=StudySessionRead)
def complete_study_session(
    session_id: int,
    payload: SessionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySessionRead:
    """Mark a study session as COMPLETED and update topic progress."""
    session = (
        db.query(StudySession)
        .filter(StudySession.id == session_id, StudySession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.status = "COMPLETED"
    session.actual_minutes = payload.actual_minutes
    session.completion_percentage = payload.completion_percentage

    # Update corresponding topic progress if attached
    if session.topic:
        if payload.topic_progress is not None:
            session.topic.progress_percentage = min(100.0, payload.topic_progress)
        else:
            # Increment topic progress based on minutes studied
            est = max(1, session.topic.estimated_minutes)
            added_prog = (payload.actual_minutes / est) * 100.0
            session.topic.progress_percentage = min(100.0, session.topic.progress_percentage + added_prog)

        if session.topic.progress_percentage >= 100.0:
            session.topic.status = "COMPLETED"
        elif session.topic.progress_percentage > 0:
            session.topic.status = "IN_PROGRESS"

    db.commit()
    db.refresh(session)

    item = StudySessionRead.model_validate(session)
    item.subject_name = session.subject.name if session.subject else None
    item.topic_name = session.topic.name if session.topic else None
    return item


@router.post("/study-sessions/{session_id}/miss", response_model=StudySessionRead)
def mark_study_session_missed(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySessionRead:
    """Mark a session as MISSED and adaptively trigger rescheduling."""
    session = (
        db.query(StudySession)
        .filter(StudySession.id == session_id, StudySession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.status = "MISSED"
    db.commit()

    # Adaptive rescheduling triggered automatically
    reschedule_adaptive(db, current_user.id, reason=f"Session #{session_id} missed")

    item = StudySessionRead.model_validate(session)
    item.subject_name = session.subject.name if session.subject else None
    item.topic_name = session.topic.name if session.topic else None
    return item


@router.post("/study-plan/reschedule", response_model=StudyPlanRead)
def trigger_reschedule(
    payload: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanRead:
    """Trigger adaptive recalculation of the planning horizon."""
    plan = reschedule_adaptive(db, current_user.id, reason=payload.reason)
    return _format_plan_response(plan)
