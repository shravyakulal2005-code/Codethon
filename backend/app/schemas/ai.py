"""AI Assistant and Timetable Extraction schemas."""

from pydantic import BaseModel, Field


class AIAssistantMessage(BaseModel):
    message: str
    mode: str = Field(default="general", description="general, planning, progress, recommendations, reschedule, qna")
    subject_id: int | None = None
    classroom_id: int | None = None


class AIAssistantResponse(BaseModel):
    reply: str
    suggested_action: dict | None = None
    model: str


class TimetableExtractRequest(BaseModel):
    raw_text: str
    classroom_id: int | None = None


class ExtractedExam(BaseModel):
    subject: str
    exam_date: str
    start_time: str = "10:00"
    duration_minutes: int = 180
    weightage: float = 50.0


class TimetableExtractResponse(BaseModel):
    extracted_exams: list[ExtractedExam]
    raw_summary: str
    model: str


class LiveAudioGuidanceRequest(BaseModel):
    prompt: str
    subject_id: int | None = None
    context_notes: str | None = None


class LiveAudioGuidanceResponse(BaseModel):
    transcript_guidance: str
    spoken_summary: str
    action_items: list[str] = []
    model: str
