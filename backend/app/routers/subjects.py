"""Subjects endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectRead
from app.services.analytics import calculate_subject_progress

router = APIRouter(tags=["subjects"])


@router.post("/classrooms/{classroom_id}/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(
    classroom_id: int,
    payload: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubjectRead:
    """Create a subject inside an owned classroom."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    subject = Subject(
        classroom_id=classroom_id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    read_obj = SubjectRead.model_validate(subject)
    read_obj.topic_count = 0
    read_obj.progress = 0.0
    return read_obj


@router.get("/classrooms/{classroom_id}/subjects", response_model=list[SubjectRead])
def list_subjects_for_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SubjectRead]:
    """List all subjects within a specific classroom."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    results = []
    for s in classroom.subjects:
        item = SubjectRead.model_validate(s)
        item.topic_count = len(s.topics)
        item.progress = calculate_subject_progress(s.topics)
        results.append(item)
    return results


@router.get("/subjects/{subject_id}", response_model=SubjectRead)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubjectRead:
    """Get subject details with topic count and calculated progress."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    item = SubjectRead.model_validate(subject)
    item.topic_count = len(subject.topics)
    item.progress = calculate_subject_progress(subject.topics)
    return item


@router.put("/subjects/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubjectRead:
    """Update subject information."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if payload.name is not None:
        subject.name = payload.name
    if payload.code is not None:
        subject.code = payload.code
    if payload.description is not None:
        subject.description = payload.description

    db.commit()
    db.refresh(subject)

    item = SubjectRead.model_validate(subject)
    item.topic_count = len(subject.topics)
    item.progress = calculate_subject_progress(subject.topics)
    return item


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a subject and its associated topics, exams, and notes."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    db.delete(subject)
    db.commit()
