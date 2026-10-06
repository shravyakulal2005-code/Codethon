"""AI endpoints: Study Assistant, Timetable Extraction, and Live Audio Guidance."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.exam import Exam
from app.models.study_session import StudySession
from app.schemas.ai import (
    AIAssistantMessage,
    AIAssistantResponse,
    TimetableExtractRequest,
    TimetableExtractResponse,
    ExtractedExam,
    LiveAudioGuidanceRequest,
    LiveAudioGuidanceResponse,
)
from app.services.gemini import (
    generate_study_assistant_reply,
    extract_timetable_from_text,
    generate_live_audio_guidance,
)
from app.services.analytics import get_subject_analytics, detect_weak_subjects
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=AIAssistantResponse)
def ai_study_assistant_chat(
    payload: AIAssistantMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AIAssistantResponse:
    """Conversational AI Study Assistant for planning, progress, recommendations, and motivation."""
    # Gather academic context to ground the assistant
    subjs_analytics, overall_prog = get_subject_analytics(db, current_user.id)
    weak_subjs = detect_weak_subjects(db, current_user.id)

    upcoming_exams = (
        db.query(Exam)
        .join(Subject, Exam.subject_id == Subject.id)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Classroom.user_id == current_user.id)
        .all()
    )

    academic_context = {
        "student_name": current_user.name,
        "overall_progress_percentage": overall_prog,
        "subjects": [s.model_dump() for s in subjs_analytics],
        "weak_subjects": [w.subject_name for w in weak_subjs if w.attention_level == "HIGH"],
        "upcoming_exams": [{"title": e.title, "date": str(e.exam_date)} for e in upcoming_exams[:3]],
    }

    reply, suggested_action = generate_study_assistant_reply(
        message=payload.message,
        mode=payload.mode,
        user_context=academic_context,
    )

    return AIAssistantResponse(
        reply=reply,
        suggested_action=suggested_action,
        model=settings.gemini_text_model,
    )


@router.post("/timetable/extract", response_model=TimetableExtractResponse)
def extract_timetable(
    payload: TimetableExtractRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TimetableExtractResponse:
    """Extract structured exam dates and subjects from raw syllabus / timetable text."""
    extracted_data = extract_timetable_from_text(payload.raw_text)
    exams = []
    for item in extracted_data:
        try:
            exams.append(
                ExtractedExam(
                    subject=item.get("subject", "Subject"),
                    exam_date=str(item.get("exam_date", "2026-11-20")),
                    start_time=item.get("start_time", "10:00"),
                    duration_minutes=int(item.get("duration_minutes", 180)),
                    weightage=float(item.get("weightage", 50.0)),
                )
            )
        except Exception:
            continue

    return TimetableExtractResponse(
        extracted_exams=exams,
        raw_summary=f"Extracted {len(exams)} upcoming exam schedules.",
        model=settings.gemini_text_model,
    )


@router.post("/audio/guidance", response_model=LiveAudioGuidanceResponse)
def live_audio_guidance(
    payload: LiveAudioGuidanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LiveAudioGuidanceResponse:
    """Interactive voice-ready study coaching powered by Gemini Live."""
    subject_name = None
    if payload.subject_id:
        s = db.query(Subject).filter(Subject.id == payload.subject_id).first()
        if s:
            subject_name = s.name

    guidance = generate_live_audio_guidance(
        prompt=payload.prompt,
        subject_name=subject_name,
        context_notes=payload.context_notes,
    )

    return LiveAudioGuidanceResponse(
        transcript_guidance=guidance["transcript_guidance"],
        spoken_summary=guidance["spoken_summary"],
        action_items=guidance["action_items"],
        model=settings.gemini_live_model,
    )
