"""Assignments endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.assignment import Assignment
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentRead

router = APIRouter(tags=["assignments"])


@router.post("/subjects/{subject_id}/assignments", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(
    subject_id: int,
    payload: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentRead:
    """Create a new coursework assignment under a subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    assignment = Assignment(
        subject_id=subject_id,
        title=payload.title,
        description=payload.description,
        deadline=payload.deadline,
        estimated_minutes=payload.estimated_minutes,
        difficulty=payload.difficulty,
        status=payload.status,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return AssignmentRead.model_validate(assignment)


@router.get("/subjects/{subject_id}/assignments", response_model=list[AssignmentRead])
def list_assignments_for_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AssignmentRead]:
    """List all assignments for a specific subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    return [AssignmentRead.model_validate(a) for a in subject.assignments]


@router.put("/assignments/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentRead:
    """Update assignment deadline, status, or details."""
    assignment = (
        db.query(Assignment)
        .join(Subject, Assignment.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Assignment.id == assignment_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if payload.title is not None:
        assignment.title = payload.title
    if payload.description is not None:
        assignment.description = payload.description
    if payload.deadline is not None:
        assignment.deadline = payload.deadline
    if payload.estimated_minutes is not None:
        assignment.estimated_minutes = payload.estimated_minutes
    if payload.difficulty is not None:
        assignment.difficulty = payload.difficulty
    if payload.status is not None:
        assignment.status = payload.status

    db.commit()
    db.refresh(assignment)
    return AssignmentRead.model_validate(assignment)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an assignment."""
    assignment = (
        db.query(Assignment)
        .join(Subject, Assignment.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Assignment.id == assignment_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
