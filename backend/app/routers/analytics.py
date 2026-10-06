"""Analytics endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.study_session import StudySession
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics import (
    get_subject_analytics,
    calculate_study_deficit,
    detect_weak_subjects,
    predict_performance,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsSummary)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsSummary:
    """Retrieve detailed academic analytics, performance prediction, and deficit metrics."""
    subjects_stats, overall_progress = get_subject_analytics(db, current_user.id)
    deficit = calculate_study_deficit(db, current_user.id, days_horizon=7)
    weak_subjs = detect_weak_subjects(db, current_user.id)
    pred = predict_performance(db, current_user.id)

    all_sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()
    actual_hours = sum(s.actual_minutes for s in all_sessions if s.status == "COMPLETED") / 60.0
    planned_hours = (
        sum(int((s.scheduled_end - s.scheduled_start).total_seconds() / 60) for s in all_sessions) / 60.0
    )
    completed_cnt = sum(1 for s in all_sessions if s.status == "COMPLETED")
    missed_cnt = sum(1 for s in all_sessions if s.status == "MISSED")
    total_tracked = completed_cnt + missed_cnt
    comp_rate = round((completed_cnt / total_tracked * 100.0) if total_tracked > 0 else 100.0, 1)

    return AnalyticsSummary(
        overall_progress=overall_progress,
        subjects=subjects_stats,
        total_study_hours_done=round(actual_hours, 1),
        total_planned_hours=round(planned_hours, 1),
        completion_rate=comp_rate,
        missed_sessions_count=missed_cnt,
        weak_subjects=weak_subjs,
        deficit=deficit,
        prediction=pred,
    )
