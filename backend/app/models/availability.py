"""Study Availability ORM model."""

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudyAvailability(Base):
    """Recurring weekly study slots defined by the student."""

    __tablename__ = "study_availability"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # Day of week: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g. "18:00"
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)    # e.g. "21:00"
    available_minutes: Mapped[int] = mapped_column(Integer, default=180)
