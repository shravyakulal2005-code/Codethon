"""Exam schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ExamBase(BaseModel):
    title: str
    exam_date: datetime
    start_time: str | None = None
    duration_minutes: int = Field(default=180, ge=15)
    weightage: float = Field(default=50.0, ge=0.0, le=100.0)


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    title: str | None = None
    exam_date: datetime | None = None
    start_time: str | None = None
    duration_minutes: int | None = Field(default=None, ge=15)
    weightage: float | None = Field(default=None, ge=0.0, le=100.0)


class ExamRead(ExamBase):
    id: int
    subject_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
