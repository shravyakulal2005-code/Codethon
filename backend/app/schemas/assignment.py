"""Assignment schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AssignmentBase(BaseModel):
    title: str
    description: str | None = None
    deadline: datetime
    estimated_minutes: int = Field(default=120, ge=10)
    difficulty: int = Field(default=2, ge=1, le=3)
    status: str = Field(default="PENDING", description="PENDING, IN_PROGRESS, COMPLETED, OVERDUE")


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    estimated_minutes: int | None = Field(default=None, ge=10)
    difficulty: int | None = Field(default=None, ge=1, le=3)
    status: str | None = None


class AssignmentRead(AssignmentBase):
    id: int
    subject_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
