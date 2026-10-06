"""Study Priority Engine.

Calculates normalized 0-100 priority scores for topics and assignments
based on deadline urgency, difficulty, remaining work, progress deficit,
and exam importance (Roadmap Phase 9 / Sections 23-26).
"""

from datetime import datetime, timezone
from typing import Any


def calculate_deadline_urgency(target_date: datetime | None, now: datetime | None = None) -> float:
    """Calculate urgency score (0-100) based on days remaining until exam or deadline."""
    if not target_date:
        return 20.0

    if now is None:
        now = datetime.now(timezone.utc)

    # Ensure timezone consistency
    if target_date.tzinfo is None:
        target_date = target_date.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    diff = (target_date - now).total_seconds() / 86400.0

    if diff <= 0:
        return 100.0
    elif diff <= 1:
        return 100.0
    elif diff <= 2:
        return 90.0
    elif diff <= 3:
        return 80.0
    elif diff <= 7:
        return 60.0
    elif diff <= 14:
        return 35.0
    elif diff <= 30:
        return 15.0
    else:
        return max(5.0, 15.0 - (diff - 30.0) * 0.2)


def calculate_difficulty_score(difficulty: int) -> float:
    """Normalize 1-3 difficulty to 0-100."""
    mapping = {1: 33.3, 2: 66.7, 3: 100.0}
    return mapping.get(difficulty, 66.7)


def calculate_remaining_work_score(estimated_minutes: int, progress_percentage: float) -> float:
    """Calculate remaining work in minutes and normalize to 0-100 scale."""
    prog = max(0.0, min(100.0, progress_percentage))
    remaining_minutes = estimated_minutes * (1.0 - (prog / 100.0))
    # Standardize: 180+ minutes remaining represents 100 score
    return min(100.0, (remaining_minutes / 180.0) * 100.0)


def calculate_low_progress_score(progress_percentage: float) -> float:
    """Invert progress: lower progress means higher priority."""
    prog = max(0.0, min(100.0, progress_percentage))
    return 100.0 - prog


def calculate_topic_priority(
    topic: Any,
    nearest_exam_date: datetime | None = None,
    exam_weightage: float = 50.0,
    w1: float = 0.30,  # Deadline Urgency
    w2: float = 0.20,  # Difficulty
    w3: float = 0.20,  # Remaining Work
    w4: float = 0.15,  # Low Progress
    w5: float = 0.15,  # Exam Importance
) -> float:
    """Calculate overall priority score (0-100) for an academic topic."""
    urgency = calculate_deadline_urgency(nearest_exam_date)
    diff = calculate_difficulty_score(getattr(topic, "difficulty", 2))
    rem_work = calculate_remaining_work_score(
        getattr(topic, "estimated_minutes", 60),
        getattr(topic, "progress_percentage", 0.0),
    )
    low_prog = calculate_low_progress_score(getattr(topic, "progress_percentage", 0.0))
    exam_imp = min(100.0, max(0.0, exam_weightage))

    priority = (
        w1 * urgency
        + w2 * diff
        + w3 * rem_work
        + w4 * low_prog
        + w5 * exam_imp
    )
    return round(priority, 2)
