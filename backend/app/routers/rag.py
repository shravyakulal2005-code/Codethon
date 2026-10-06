"""RAG Q&A endpoints over student notes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse
from app.services.rag import retrieve_relevant_chunks, format_context_and_citations
from app.services.gemini import generate_rag_answer
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query", response_model=RAGQueryResponse)
def query_study_notes(
    payload: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RAGQueryResponse:
    """Retrieve relevant excerpts from uploaded notes and answer the question with citations."""
    # 1. Retrieve user-owned chunks
    matches = retrieve_relevant_chunks(
        db=db,
        user_id=current_user.id,
        query=payload.question,
        subject_id=payload.subject_id,
        classroom_id=payload.classroom_id,
        top_k=payload.top_k,
    )

    if not matches:
        return RAGQueryResponse(
            answer="No relevant notes found for this subject. Please upload your lecture notes or PDF slides first.",
            citations=[],
            model=settings.gemini_text_model,
        )

    # 2. Build prompt context and citation objects
    context_str, citations = format_context_and_citations(matches)

    # 3. Call Gemini to answer
    answer = generate_rag_answer(context=context_str, question=payload.question)

    return RAGQueryResponse(
        answer=answer,
        citations=citations,
        model=settings.gemini_text_model,
    )
