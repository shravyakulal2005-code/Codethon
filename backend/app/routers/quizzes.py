"""Quizzes router: automated quiz generation from notes and evaluation."""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.note import Note, NoteChunk
from app.models.quiz import Quiz, QuizQuestion
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizRead,
    QuizQuestionRead,
    QuizSubmitRequest,
    QuizResultResponse,
)
from app.services.gemini import generate_quiz_from_notes

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _format_quiz_read(quiz: Quiz) -> QuizRead:
    q_reads = []
    for q in quiz.questions:
        try:
            opts = json.loads(q.options) if isinstance(q.options, str) else q.options
        except Exception:
            opts = [q.options]
        q_reads.append(
            QuizQuestionRead(
                id=q.id,
                question=q.question,
                options=opts if isinstance(opts, list) else [str(opts)],
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                user_answer=q.user_answer,
                is_correct=q.is_correct,
            )
        )
    return QuizRead(
        id=quiz.id,
        subject_id=quiz.subject_id,
        title=quiz.title,
        topic_name=quiz.topic_name,
        score=quiz.score,
        total_questions=quiz.total_questions,
        created_at=quiz.created_at,
        questions=q_reads,
    )


@router.post("/generate", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    payload: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizRead:
    """Generate a quiz for a subject/topic based on uploaded student notes."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == payload.subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Gather notes text for context
    notes = db.query(Note).filter(Note.subject_id == payload.subject_id, Note.user_id == current_user.id).all()
    context_text = ""
    for n in notes:
        for c in n.chunks[:6]:
            context_text += f"\n{c.text}"

    # Generate questions via Gemini
    generated_raw = generate_quiz_from_notes(
        subject_name=subject.name,
        topic_name=payload.topic_name,
        context_text=context_text,
        num_questions=payload.num_questions,
        difficulty=payload.difficulty,
    )

    title = f"{subject.name} - {payload.topic_name or 'General Review'} Quiz"
    quiz = Quiz(
        user_id=current_user.id,
        subject_id=subject.id,
        title=title,
        topic_name=payload.topic_name,
        total_questions=len(generated_raw),
    )
    db.add(quiz)
    db.flush()

    for item in generated_raw:
        q_obj = QuizQuestion(
            quiz_id=quiz.id,
            question=item.get("question", "Question"),
            options=json.dumps(item.get("options", ["A", "B", "C", "D"])),
            correct_answer=item.get("correct_answer", "A"),
            explanation=item.get("explanation", ""),
        )
        db.add(q_obj)

    db.commit()
    db.refresh(quiz)
    return _format_quiz_read(quiz)


@router.get("/{quiz_id}", response_model=QuizRead)
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizRead:
    """Get a quiz and its questions."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    return _format_quiz_read(quiz)


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz_answers(
    quiz_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizResultResponse:
    """Submit student answers, evaluate score, and return explanations."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    correct_count = 0
    total = len(quiz.questions)

    for q in quiz.questions:
        user_ans = payload.answers.get(q.id) or ""
        q.user_answer = user_ans
        # Check matching letter (e.g. 'A' in 'A. ...' or exact match)
        clean_user = user_ans.strip()[:1].upper()
        clean_corr = q.correct_answer.strip()[:1].upper()
        is_corr = (clean_user == clean_corr) if clean_user else False
        q.is_correct = is_corr
        if is_corr:
            correct_count += 1

    pct = round((correct_count / total * 100.0) if total > 0 else 0.0, 1)
    quiz.score = float(correct_count)
    db.commit()
    db.refresh(quiz)

    feedback = (
        "Outstanding! Complete concept mastery."
        if pct >= 80
        else "Good job! Review the explanations for missed questions."
        if pct >= 50
        else "Needs attention. We recommend reviewing notes and re-attempting."
    )

    q_reads = []
    for q in quiz.questions:
        try:
            opts = json.loads(q.options)
        except Exception:
            opts = [q.options]
        q_reads.append(
            QuizQuestionRead(
                id=q.id,
                question=q.question,
                options=opts,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                user_answer=q.user_answer,
                is_correct=q.is_correct,
            )
        )

    return QuizResultResponse(
        quiz_id=quiz.id,
        score=float(correct_count),
        total=total,
        percentage=pct,
        feedback=feedback,
        questions=q_reads,
    )
