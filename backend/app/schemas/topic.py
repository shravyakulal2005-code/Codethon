"""Topic schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TopicBase(BaseModel):
    name: str
    description: str | None = None
    difficulty: int = Field(default=2, ge=1, le=3, description="1=Easy, 2=Medium, 3=Hard")
    estimated_minutes: int = Field(default=60, ge=5, description="Estimated minutes to master topic")
    progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    status: str = Field(default="PENDING", description="PENDING, IN_PROGRESS, COMPLETED")


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    difficulty: int | None = Field(default=None, ge=1, le=3)
    estimated_minutes: int | None = Field(default=None, ge=5)
    progress_percentage: float | None = Field(default=None, ge=0.0, le=100.0)
    status: str | None = None


class TopicRead(TopicBase):
    id: int
    subject_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
