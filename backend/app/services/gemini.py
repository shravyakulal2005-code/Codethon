"""Gemini AI Service for Text, RAG, Quiz Generation, Timetable Extraction, and Live Audio Guidance.

Implements text-based work with Gemini Flash and audio-oriented guidance with Gemini Live.
"""

import json
import logging
import httpx

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("gemini_service")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def call_gemini(prompt: str, system_instruction: str = "", model: str | None = None) -> str:
    """Call Google Gemini API via REST with graceful fallback."""
    if not settings.gemini_api_key:
        return "Gemini API key is not configured. Please provide a valid key in the environment."

    target_model = model or settings.gemini_text_model

    headers = {"Content-Type": "application/json"}
    params = {"key": settings.gemini_api_key}

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    candidate_models = [
        target_model,
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash",
    ]
    # Remove duplicates while preserving order
    tried = set()
    model_list = [m for m in candidate_models if not (m in tried or tried.add(m))]

    try:
        with httpx.Client(timeout=7.0) as client:
            for m in model_list:
                url = GEMINI_API_URL.format(model=m)
                resp = client.post(url, headers=headers, params=params, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    logger.debug(f"Gemini API model {m} returned status {resp.status_code}")
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}")

    return "AI response is temporarily unavailable. Please verify network connectivity or API key limits."


def generate_rag_answer(context: str, question: str) -> str:
    """Answer question strictly based on retrieved student study notes (Roadmap Section 44)."""
    system_instruction = (
        "You are an academic study assistant for university students. "
        "Answer the question using ONLY the provided study material context. "
        "Cite the document name or section whenever referencing facts. "
        "If the uploaded material does not contain the answer, explicitly state that "
        "the uploaded material does not contain enough information on this topic."
    )
    prompt = f"Context from student notes:\n{context}\n\nStudent Question:\n{question}"
    return call_gemini(prompt, system_instruction=system_instruction)


def generate_study_assistant_reply(message: str, mode: str, user_context: dict) -> tuple[str, dict | None]:
    """Provide AI study guidance, timetable advice, or scheduling recommendations."""
    system_instruction = (
        "You are 'StudyMind AI', an intelligent academic coach. "
        "Help the student with study planning, topic prioritization, syllabus completion, "
        "and motivation based on their academic situation."
    )
    ctx_str = json.dumps(user_context, indent=2)
    prompt = f"Mode: {mode}\nStudent's Academic Context:\n{ctx_str}\n\nStudent Request: {message}"

    reply = call_gemini(prompt, system_instruction=system_instruction)

    # Detect structured action if applicable
    suggested_action = None
    msg_lower = message.lower()
    if "reschedule" in msg_lower or "missed" in msg_lower or "catch up" in msg_lower:
        suggested_action = {"action": "RESCHEDULE", "label": "Recalculate Schedule"}
    elif "quiz" in msg_lower or "test me" in msg_lower:
        suggested_action = {"action": "START_QUIZ", "label": "Generate Quiz"}

    return reply, suggested_action


def generate_quiz_from_notes(
    subject_name: str,
    topic_name: str | None,
    context_text: str,
    num_questions: int = 5,
    difficulty: str = "medium",
) -> list[dict]:
    """Generate multiple choice questions based on notes context or topic."""
    system_instruction = (
        "You are an academic exam generator. Generate a rigorous multiple-choice quiz "
        "in JSON format. Return ONLY a valid JSON list of question objects with no markdown code fences. "
        "Each object must have: 'question' (string), 'options' (list of 4 strings like 'A. ...', 'B. ...', 'C. ...', 'D. ...'), "
        "'correct_answer' (e.g. 'A'), and 'explanation' (string)."
    )
    prompt = (
        f"Subject: {subject_name}\n"
        f"Topic: {topic_name or 'Key syllabus themes'}\n"
        f"Difficulty: {difficulty}\n"
        f"Number of questions: {num_questions}\n"
        f"Study Material Excerpt:\n{context_text[:3000]}\n\n"
        "Generate the questions in JSON list format."
    )

    raw = call_gemini(prompt, system_instruction=system_instruction)
    clean = raw.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    if clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()

    try:
        parsed = json.loads(clean)
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed
    except Exception:
        pass

    # Deterministic fallback quiz if parsing failed or offline
    topic_label = topic_name or subject_name
    return [
        {
            "question": f"Which core principle is fundamental to understanding {topic_label}?",
            "options": [
                f"A. Foundational definition and architecture of {topic_label}",
                "B. Completely unrelated algorithmic principles",
                "C. Random stochastic approximation without convergence",
                "D. Manual brute-force enumeration without constraints",
            ],
            "correct_answer": "A",
            "explanation": f"Understanding the foundational definitions and architecture is central to mastering {topic_label}.",
        },
        {
            "question": f"What is the most effective study approach when preparing for examinations on {topic_label}?",
            "options": [
                "A. Active recall and solving practice questions",
                "B. Rote memorization without understanding concepts",
                "C. Skipping revision blocks before the deadline",
                "D. Only reading the table of contents",
            ],
            "correct_answer": "A",
            "explanation": "Active recall with spaced repetition maximizes exam retention and conceptual clarity.",
        },
    ]


def extract_timetable_from_text(raw_text: str) -> list[dict]:
    """Extract subjects, exam dates, start times, and durations from unstructured timetable text."""
    system_instruction = (
        "You are a timetable extraction engine. Extract all exams found in the provided text into a JSON list. "
        "Return ONLY a valid JSON list of objects with no markdown fences. "
        "Each object must have: 'subject' (string), 'exam_date' (string formatted as YYYY-MM-DD), "
        "'start_time' (string like '10:00'), 'duration_minutes' (integer like 180), 'weightage' (float like 50.0)."
    )
    prompt = f"Timetable text:\n{raw_text}\n\nExtract all exams into JSON."

    raw = call_gemini(prompt, system_instruction=system_instruction)
    clean = raw.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    if clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()

    try:
        parsed = json.loads(clean)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass

    return []


def generate_live_audio_guidance(prompt: str, subject_name: str | None = None, context_notes: str | None = None) -> dict:
    """Generate live interactive audio study guidance and spoken conversational response."""
    system_instruction = (
        "You are StudyMind Live Audio Coach powered by Gemini Live. "
        "Provide spoken, conversational, encouraging audio guidance as if speaking directly to a student. "
        "Keep language natural, clear, rhythmically suited for text-to-speech voice playback, and focused on practical study mastery."
    )
    full_prompt = (
        f"Subject Context: {subject_name or 'General Studies'}\n"
        f"Notes Summary: {context_notes or 'None'}\n"
        f"Student Query: {prompt}\n\n"
        "Provide a spoken voice response followed by 2 bulleted immediate action items."
    )
    spoken_text = call_gemini(full_prompt, system_instruction=system_instruction, model=settings.gemini_live_model)

    return {
        "transcript_guidance": spoken_text,
        "spoken_summary": spoken_text[:300] + ("..." if len(spoken_text) > 300 else ""),
        "action_items": [
            "Start the highest priority topic session today",
            "Review flashcards or quiz from uploaded notes",
        ],
        "model": settings.gemini_live_model,
    }
