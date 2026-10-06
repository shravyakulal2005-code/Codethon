"""Notes and PDF upload endpoints."""

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.note import Note, NoteChunk
from app.schemas.note import NoteRead
from app.services.storage import (
    save_uploaded_file,
    upload_to_cloudinary_if_configured,
    extract_text_and_chunks,
)

router = APIRouter(tags=["notes"])


@router.post("/subjects/{subject_id}/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def upload_subject_note(
    subject_id: int,
    file: UploadFile = File(...),
    title: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteRead:
    """Upload study material / PDF, extract text, and index for RAG."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    content = await file.read()
    file_size = len(content)
    orig_name = file.filename or "study_material.pdf"
    note_title = title or orig_name

    # 1. Save file locally
    saved_path = save_uploaded_file(content, orig_name)

    # 2. Upload to Cloudinary if available
    cloud_url = upload_to_cloudinary_if_configured(saved_path)

    # 3. Create Note record
    note = Note(
        user_id=current_user.id,
        classroom_id=subject.classroom_id,
        subject_id=subject.id,
        title=note_title,
        file_path=saved_path,
        file_type=orig_name.split(".")[-1].lower() if "." in orig_name else "pdf",
        file_size=file_size,
        cloudinary_url=cloud_url,
        processing_status="PROCESSING",
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # 4. Extract and create chunks
    try:
        chunks_data = extract_text_and_chunks(saved_path)
        for c in chunks_data:
            chunk = NoteChunk(
                note_id=note.id,
                chunk_index=c["chunk_index"],
                page_number=c["page_number"],
                text=c["text"],
            )
            db.add(chunk)
        note.processing_status = "READY"
    except Exception:
        note.processing_status = "FAILED"

    db.commit()
    db.refresh(note)

    read_obj = NoteRead.model_validate(note)
    read_obj.chunk_count = len(note.chunks)
    return read_obj


@router.get("/subjects/{subject_id}/notes", response_model=list[NoteRead])
def list_notes_for_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NoteRead]:
    """List all notes belonging to the specified subject."""
    subject = (
        db.query(Subject)
        .join(Classroom, Subject.classroom_id == Classroom.id)
        .filter(Subject.id == subject_id, Classroom.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    results = []
    for n in subject.notes:
        item = NoteRead.model_validate(n)
        item.chunk_count = len(n.chunks)
        results.append(item)
    return results


@router.get("/notes/{note_id}", response_model=NoteRead)
def get_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteRead:
    """Retrieve metadata for a specific note."""
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    item = NoteRead.model_validate(note)
    item.chunk_count = len(note.chunks)
    return item


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a note and its indexed chunks."""
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    # Clean up local file
    try:
        if os.path.exists(note.file_path):
            os.remove(note.file_path)
    except Exception:
        pass

    db.delete(note)
    db.commit()
