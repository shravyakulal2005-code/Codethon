"""Study Plan and Session schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PlanGenerateRequest(BaseModel):
    classroom_id: int | None = None
    days_ahead: int = Field(default=7, ge=1, le=60)
    reason: str = "Student requested plan generation"


class StudySessionRead(BaseModel):
    id: int
    user_id: int
    subject_id: int
    subject_name: str | None = None
    topic_id: int | None = None
    topic_name: str | None = None
    plan_id: int | None = None
    session_type: str
    scheduled_start: datetime
    scheduled_end: datetime
    actual_minutes: int
    status: str
    completion_percentage: float

    model_config = ConfigDict(from_attributes=True)


class StudyPlanRead(BaseModel):
    id: int
    user_id: int
    classroom_id: int | None = None
    generated_at: datetime
    valid_from: datetime
    valid_until: datetime
    version: int
    reason: str
    status: str
    sessions: list[StudySessionRead] = []

    model_config = ConfigDict(from_attributes=True)


class SessionCompleteRequest(BaseModel):
    actual_minutes: int = Field(ge=0)
    completion_percentage: float = Field(default=100.0, ge=0.0, le=100.0)
    topic_progress: float | None = Field(default=None, ge=0.0, le=100.0)


class RescheduleRequest(BaseModel):
    reason: str = "Missed session / schedule adjustment"
    days_ahead: int = Field(default=7, ge=1, le=60)
