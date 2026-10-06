"""Study Availability endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.availability import StudyAvailability
from app.schemas.availability import AvailabilitySlot, AvailabilityBatchCreate, AvailabilityRead

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("", response_model=list[AvailabilityRead], status_code=status.HTTP_201_CREATED)
def set_availability_batch(
    payload: AvailabilityBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AvailabilityRead]:
    """Replace student's weekly study slots with new schedule."""
    # Delete existing slots for clean update
    db.query(StudyAvailability).filter(StudyAvailability.user_id == current_user.id).delete()

    created_records = []
    for slot in payload.slots:
        rec = StudyAvailability(
            user_id=current_user.id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
            end_time=slot.end_time,
            available_minutes=slot.available_minutes,
        )
        db.add(rec)
        created_records.append(rec)

    db.commit()
    for rec in created_records:
        db.refresh(rec)
    return [AvailabilityRead.model_validate(r) for r in created_records]


@router.get("", response_model=list[AvailabilityRead])
def get_availability(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AvailabilityRead]:
    """Get all recurring study availability slots for current user."""
    records = (
        db.query(StudyAvailability)
        .filter(StudyAvailability.user_id == current_user.id)
        .order_by(StudyAvailability.day_of_week.asc(), StudyAvailability.start_time.asc())
        .all()
    )
    return [AvailabilityRead.model_validate(r) for r in records]


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a single availability slot."""
    slot = (
        db.query(StudyAvailability)
        .filter(StudyAvailability.id == slot_id, StudyAvailability.user_id == current_user.id)
        .first()
    )
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    db.delete(slot)
    db.commit()
