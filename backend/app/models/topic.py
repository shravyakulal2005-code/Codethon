"""Topic ORM model."""

from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Topic(Base):
    """Topic or syllabus module within a subject."""

    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Difficulty: 1 = Easy, 2 = Medium, 3 = Hard
    difficulty: Mapped[int] = mapped_column(Integer, default=2)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=60)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    # Status: PENDING, IN_PROGRESS, COMPLETED
    status: Mapped[str] = mapped_column(String(30), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    subject = relationship("Subject", back_populates="topics")
    study_sessions = relationship("StudySession", back_populates="topic", cascade="all, delete-orphan")
