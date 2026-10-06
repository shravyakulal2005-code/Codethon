"""Topics endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.topic import Topic
from app.schemas.topic import TopicCreate, TopicUpdate, TopicRead

router = APIRouter(tags=["topics"])


@router.post("/subjects/{subject_id}/topics", response_model=TopicRead, status_code=status.HTTP_201_CREATED)
def create_topic(
    subject_id: int,
    payload: TopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TopicRead:
    """Create a topic under a subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    topic = Topic(
        subject_id=subject_id,
        name=payload.name,
        description=payload.description,
        difficulty=payload.difficulty,
        estimated_minutes=payload.estimated_minutes,
        progress_percentage=payload.progress_percentage,
        status=payload.status,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return TopicRead.model_validate(topic)


@router.get("/subjects/{subject_id}/topics", response_model=list[TopicRead])
def list_topics_for_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TopicRead]:
    """List all topics for a specific subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    return [TopicRead.model_validate(t) for t in subject.topics]


@router.put("/topics/{topic_id}", response_model=TopicRead)
def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TopicRead:
    """Update topic details or progress percentage."""
    topic = (
        db.query(Topic)
        .join(Subject, Topic.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Topic.id == topic_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    if payload.name is not None:
        topic.name = payload.name
    if payload.description is not None:
        topic.description = payload.description
    if payload.difficulty is not None:
        topic.difficulty = payload.difficulty
    if payload.estimated_minutes is not None:
        topic.estimated_minutes = payload.estimated_minutes
    if payload.progress_percentage is not None:
        topic.progress_percentage = payload.progress_percentage
        if topic.progress_percentage >= 100.0:
            topic.status = "COMPLETED"
        elif topic.progress_percentage > 0:
            topic.status = "IN_PROGRESS"
    if payload.status is not None:
        topic.status = payload.status

    db.commit()
    db.refresh(topic)
    return TopicRead.model_validate(topic)


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a topic."""
    topic = (
        db.query(Topic)
        .join(Subject, Topic.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Topic.id == topic_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    db.delete(topic)
    db.commit()
