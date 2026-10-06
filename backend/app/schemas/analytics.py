"""Analytics schemas."""

from pydantic import BaseModel
from app.schemas.dashboard import WeakSubjectItem, StudyDeficitInfo


class SubjectAnalytics(BaseModel):
    subject_id: int
    subject_name: str
    total_topics: int
    completed_topics: int
    progress_percentage: float
    total_study_minutes: int
    weightage: float


class PredictionResult(BaseModel):
    syllabus_completion_probability: float
    velocity_topics_per_week: float
    consistency_rate: float
    verdict: str
    advice: str


class AnalyticsSummary(BaseModel):
    overall_progress: float
    subjects: list[SubjectAnalytics]
    total_study_hours_done: float
    total_planned_hours: float
    completion_rate: float
    missed_sessions_count: int
    weak_subjects: list[WeakSubjectItem]
    deficit: StudyDeficitInfo
    prediction: PredictionResult
