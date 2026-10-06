"""Dashboard schemas."""

from pydantic import BaseModel
from app.schemas.study_plan import StudySessionRead
from app.schemas.exam import ExamRead
from app.schemas.assignment import AssignmentRead


class WeakSubjectItem(BaseModel):
    subject_id: int
    subject_name: str
    progress: float
    difficulty_score: float
    missed_sessions_count: int
    attention_level: str  # HIGH, MEDIUM, LOW


class StudyDeficitInfo(BaseModel):
    required_minutes: int
    available_minutes: int
    deficit_minutes: int
    recommended_daily_increase_minutes: int
    has_deficit: bool


class DashboardSummary(BaseModel):
    overall_progress: float
    study_hours_this_week: float
    study_hours_planned_this_week: float
    pending_tasks_count: int
    completed_tasks_count: int
    upcoming_exams: list[ExamRead] = []
    upcoming_assignments: list[AssignmentRead] = []
    today_sessions: list[StudySessionRead] = []
    weak_subjects: list[WeakSubjectItem] = []
    study_deficit: StudyDeficitInfo
    recent_activity: list[str] = []
