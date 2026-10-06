"""Classroom endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate, ClassroomRead

router = APIRouter(prefix="/classrooms", tags=["classrooms"])


@router.post("", response_model=ClassroomRead, status_code=status.HTTP_201_CREATED)
def create_classroom(
    payload: ClassroomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassroomRead:
    """Create a new academic classroom/semester."""
    classroom = Classroom(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        academic_year=payload.academic_year,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    read_obj = ClassroomRead.model_validate(classroom)
    read_obj.subject_count = 0
    return read_obj


@router.get("", response_model=list[ClassroomRead])
def list_classrooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ClassroomRead]:
    """List all classrooms belonging to the authenticated student."""
    classrooms = db.query(Classroom).filter(Classroom.user_id == current_user.id).all()
    results = []
    for c in classrooms:
        item = ClassroomRead.model_validate(c)
        item.subject_count = len(c.subjects)
        results.append(item)
    return results


@router.get("/{classroom_id}", response_model=ClassroomRead)
def get_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassroomRead:
    """Retrieve classroom details."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    item = ClassroomRead.model_validate(classroom)
    item.subject_count = len(classroom.subjects)
    return item


@router.put("/{classroom_id}", response_model=ClassroomRead)
def update_classroom(
    classroom_id: int,
    payload: ClassroomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassroomRead:
    """Update classroom information."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if payload.name is not None:
        classroom.name = payload.name
    if payload.description is not None:
        classroom.description = payload.description
    if payload.academic_year is not None:
        classroom.academic_year = payload.academic_year

    db.commit()
    db.refresh(classroom)
    item = ClassroomRead.model_validate(classroom)
    item.subject_count = len(classroom.subjects)
    return item


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a classroom and its associated subjects and notes."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    db.delete(classroom)
    db.commit()
