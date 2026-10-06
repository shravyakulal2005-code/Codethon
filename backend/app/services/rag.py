"""RAG Retrieval Pipeline with Strict User Ownership Enforcement.

Implements Roadmap Phase 16 (Sections 42-44 & 60).
"""

import math
import re
from sqlalchemy.orm import Session

from app.models.note import Note, NoteChunk
from app.schemas.rag import Citation


def tokenize(text: str) -> list[str]:
    """Tokenize and normalize text."""
    return [w for w in re.findall(r"\w+", text.lower()) if len(w) > 2]


def compute_bm25_score(query_tokens: list[str], doc_tokens: list[str], avg_doc_len: float) -> float:
    """Compute lightweight BM25-style lexical relevance score."""
    if not doc_tokens or not query_tokens:
        return 0.0

    k1 = 1.5
    b = 0.75
    doc_len = len(doc_tokens)
    score = 0.0

    doc_token_counts = {}
    for t in doc_tokens:
        doc_token_counts[t] = doc_token_counts.get(t, 0) + 1

    for q in query_tokens:
        if q in doc_token_counts:
            tf = doc_token_counts[q]
            denom = tf + k1 * (1.0 - b + b * (doc_len / max(1.0, avg_doc_len)))
            score += (tf * (k1 + 1.0)) / max(1.0, denom)

    return score


def retrieve_relevant_chunks(
    db: Session,
    user_id: int,
    query: str,
    subject_id: int | None = None,
    classroom_id: int | None = None,
    top_k: int = 4,
) -> list[tuple[NoteChunk, Note, float]]:
    """Retrieve top-k relevant chunks strictly owned by user_id."""
    # Query note chunks strictly filtered by user_id ownership
    q = (
        db.query(NoteChunk, Note)
        .join(Note, NoteChunk.note_id == Note.id)
        .filter(Note.user_id == user_id, Note.processing_status == "READY")
    )
    if subject_id:
        q = q.filter(Note.subject_id == subject_id)
    if classroom_id:
        q = q.filter(Note.classroom_id == classroom_id)

    records = q.all()
    if not records:
        return []

    query_tokens = tokenize(query)
    if not query_tokens:
        return [(chunk, note, 1.0) for chunk, note in records[:top_k]]

    # Compute average doc length
    total_tokens = sum(len(tokenize(chunk.text)) for chunk, _ in records)
    avg_len = total_tokens / max(1.0, len(records))

    scored = []
    for chunk, note in records:
        chunk_tokens = tokenize(chunk.text)
        score = compute_bm25_score(query_tokens, chunk_tokens, avg_len)
        if score > 0:
            scored.append((chunk, note, score))

    # Sort descending by relevance score
    scored.sort(key=lambda x: x[2], reverse=True)

    # Return top_k, or fallback to first chunks if no exact match
    if scored:
        return scored[:top_k]
    else:
        return [(chunk, note, 0.1) for chunk, note in records[:top_k]]


def format_context_and_citations(matches: list[tuple[NoteChunk, Note, float]]) -> tuple[str, list[Citation]]:
    """Format retrieved chunks into prompt context and structured citation objects."""
    citations = []
    context_blocks = []

    for chunk, note, _ in matches:
        snippet = chunk.text[:250] + ("..." if len(chunk.text) > 250 else "")
        citations.append(
            Citation(
                note_id=note.id,
                note_title=note.title,
                page_number=chunk.page_number,
                text_snippet=snippet,
            )
        )
        page_str = f"Page {chunk.page_number}" if chunk.page_number else "Section"
        context_blocks.append(f"[{note.title} - {page_str}]:\n{chunk.text}")

    context_str = "\n\n---\n\n".join(context_blocks)
    return context_str, citations
