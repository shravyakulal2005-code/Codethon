"""Classroom schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ClassroomBase(BaseModel):
    name: str
    description: str | None = None
    academic_year: str | None = None


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    academic_year: str | None = None


class ClassroomRead(ClassroomBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    subject_count: int = 0

    model_config = ConfigDict(from_attributes=True)
