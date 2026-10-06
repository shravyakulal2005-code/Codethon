"""Exams endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamUpdate, ExamRead

router = APIRouter(tags=["exams"])


@router.post("/subjects/{subject_id}/exams", response_model=ExamRead, status_code=status.HTTP_201_CREATED)
def create_exam(
    subject_id: int,
    payload: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamRead:
    """Create an upcoming exam under a subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    exam = Exam(
        subject_id=subject_id,
        title=payload.title,
        exam_date=payload.exam_date,
        start_time=payload.start_time,
        duration_minutes=payload.duration_minutes,
        weightage=payload.weightage,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return ExamRead.model_validate(exam)


@router.get("/subjects/{subject_id}/exams", response_model=list[ExamRead])
def list_exams_for_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ExamRead]:
    """List all exams for a specific subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    return [ExamRead.model_validate(e) for e in subject.exams]


@router.put("/exams/{exam_id}", response_model=ExamRead)
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamRead:
    """Update exam date or details."""
    exam = (
        db.query(Exam)
        .join(Subject, Exam.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Exam.id == exam_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    if payload.title is not None:
        exam.title = payload.title
    if payload.exam_date is not None:
        exam.exam_date = payload.exam_date
    if payload.start_time is not None:
        exam.start_time = payload.start_time
    if payload.duration_minutes is not None:
        exam.duration_minutes = payload.duration_minutes
    if payload.weightage is not None:
        exam.weightage = payload.weightage

    db.commit()
    db.refresh(exam)
    return ExamRead.model_validate(exam)


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an exam."""
    exam = (
        db.query(Exam)
        .join(Subject, Exam.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Exam.id == exam_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    db.delete(exam)
    db.commit()
