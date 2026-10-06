"""Note and NoteChunk ORM models."""

from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Note(Base):
    """Uploaded study material or PDF document."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    classroom_id: Mapped[int | None] = mapped_column(ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), default="pdf")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    cloudinary_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Processing status: UPLOADED, PROCESSING, READY, FAILED
    processing_status: Mapped[str] = mapped_column(String(30), default="UPLOADED", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    classroom = relationship("Classroom", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")
    chunks = relationship("NoteChunk", back_populates="note", cascade="all, delete-orphan")


class NoteChunk(Base):
    """Text chunk of an indexed note for RAG retrieval."""

    __tablename__ = "note_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    faiss_vector_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    note = relationship("Note", back_populates="chunks")
