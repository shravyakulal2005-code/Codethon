"""Quiz schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class QuizGenerateRequest(BaseModel):
    subject_id: int
    topic_name: str | None = None
    num_questions: int = Field(default=5, ge=1, le=15)
    difficulty: str = Field(default="medium", description="easy, medium, hard")


class QuizQuestionRead(BaseModel):
    id: int
    question: str
    options: list[str]
    correct_answer: str | None = None
    explanation: str | None = None
    user_answer: str | None = None
    is_correct: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class QuizRead(BaseModel):
    id: int
    subject_id: int
    title: str
    topic_name: str | None = None
    score: float | None = None
    total_questions: int
    created_at: datetime
    questions: list[QuizQuestionRead] = []

    model_config = ConfigDict(from_attributes=True)


class QuizSubmitRequest(BaseModel):
    answers: dict[int, str]  # question_id -> selected_option


class QuizResultResponse(BaseModel):
    quiz_id: int
    score: float
    total: int
    percentage: float
    feedback: str
    questions: list[QuizQuestionRead]
