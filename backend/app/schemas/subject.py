"""Subject schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SubjectBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class SubjectRead(SubjectBase):
    id: int
    classroom_id: int
    created_at: datetime
    updated_at: datetime
    topic_count: int = 0
    progress: float = 0.0

    model_config = ConfigDict(from_attributes=True)
