"""File Storage, Cloudinary integration, and PDF Extraction Service."""

import os
import shutil
from pathlib import Path
from pypdf import PdfReader

from app.core.config import get_settings

settings = get_settings()


def ensure_upload_dir() -> Path:
    """Ensure upload directory exists."""
    p = Path(settings.upload_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_uploaded_file(file_bytes: bytes, filename: str) -> str:
    """Save raw file bytes to local storage."""
    upload_path = ensure_upload_dir()
    safe_name = f"{os.urandom(8).hex()}_{filename}"
    target_file = upload_path / safe_name
    with open(target_file, "wb") as f:
        f.write(file_bytes)
    return str(target_file)


def upload_to_cloudinary_if_configured(file_path: str) -> str | None:
    """Optionally upload file to Cloudinary if credentials are present."""
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_secret):
        return None

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key or "default",
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        res = cloudinary.uploader.upload(file_path, resource_type="auto")
        return res.get("secure_url") or res.get("url")
    except Exception:
        # Fall back gracefully to local storage
        return None


def extract_text_and_chunks(file_path: str, chunk_size: int = 800, overlap: int = 100) -> list[dict]:
    """Extract text from PDF pages and partition into chunks with page numbers."""
    chunks = []
    try:
        reader = PdfReader(file_path)
        chunk_idx = 0

        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            text = text.strip()
            if not text:
                continue

            # Split into sliding windows
            start = 0
            while start < len(text):
                end = min(len(text), start + chunk_size)
                chunk_text = text[start:end].strip()
                if chunk_text:
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "page_number": page_num,
                        "text": chunk_text,
                    })
                    chunk_idx += 1

                if end == len(text):
                    break
                start = end - overlap

    except Exception as e:
        # If extraction fails (e.g. text file or unparseable), read as plain text fallback
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()
                if content:
                    chunks.append({
                        "chunk_index": 0,
                        "page_number": 1,
                        "text": content[:1000],
                    })
        except Exception:
            pass

    return chunks
