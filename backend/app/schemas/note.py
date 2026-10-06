"""Note schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NoteRead(BaseModel):
    id: int
    user_id: int
    classroom_id: int | None = None
    subject_id: int
    title: str
    file_type: str
    file_size: int
    cloudinary_url: str | None = None
    processing_status: str
    chunk_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
