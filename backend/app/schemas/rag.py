"""RAG schemas."""

from pydantic import BaseModel


class Citation(BaseModel):
    note_id: int
    note_title: str
    page_number: int | None = None
    text_snippet: str


class RAGQueryRequest(BaseModel):
    question: str
    subject_id: int | None = None
    classroom_id: int | None = None
    top_k: int = 4


class RAGQueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    model: str
