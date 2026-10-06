"""Study Session ORM model."""

from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudySession(Base):
    """Scheduled block of study time for a topic or assignment."""

    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("study_plans.id", ondelete="SET NULL"), nullable=True, index=True)
    # Session Type: STUDY, REVISION, ASSIGNMENT
    session_type: Mapped[str] = mapped_column(String(30), default="STUDY")
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_minutes: Mapped[int] = mapped_column(Integer, default=0)
    # Status: PLANNED, IN_PROGRESS, COMPLETED, MISSED, CANCELLED
    status: Mapped[str] = mapped_column(String(30), default="PLANNED", index=True)
    completion_percentage: Mapped[float] = mapped_column(Float, default=0.0)
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
    subject = relationship("Subject", back_populates="study_sessions")
    topic = relationship("Topic", back_populates="study_sessions")
    plan = relationship("StudyPlan", back_populates="sessions")
