"""Comprehensive test suite for the Intelligent Study Planner backend.

Tests:
1. Academic structure: Classrooms, Subjects, Topics, Exams, Assignments
2. Study Availability configuration
3. Priority Engine scoring
4. Deterministic Scheduling Engine
5. Study Session tracking (complete & miss)
6. Adaptive Rescheduling
7. Aggregated Dashboard metrics
8. Analytics, Deficit & Prediction
9. Notes & RAG Q&A
10. Quiz generation & submission
11. AI Assistant & Live Audio endpoints
"""

import io
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient

AUTH_HEADERS = {}


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """Register and authenticate a student for testing."""
    user_data = {
        "name": "Prajwal",
        "email": "prajwal@studyplanner.io",
        "password": "Password123",
    }
    resp = client.post("/auth/register", json=user_data)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_classroom_and_subject_flow(client: TestClient, auth_headers: dict):
    # 1. Create Classroom
    c_resp = client.post(
        "/classrooms",
        json={"name": "Computer Science - Semester 7", "description": "Final Year", "academic_year": "2026-2027"},
        headers=auth_headers,
    )
    assert c_resp.status_code == 201
    c_data = c_resp.json()
    classroom_id = c_data["id"]
    assert c_data["name"] == "Computer Science - Semester 7"

    # 2. Add Subject to Classroom
    s_resp = client.post(
        f"/classrooms/{classroom_id}/subjects",
        json={"name": "Machine Learning", "code": "CS701", "description": "Core ML and Deep Learning"},
        headers=auth_headers,
    )
    assert s_resp.status_code == 201
    subject_id = s_resp.json()["id"]

    # 3. Add Topics
    t1_resp = client.post(
        f"/subjects/{subject_id}/topics",
        json={"name": "Linear Regression", "difficulty": 1, "estimated_minutes": 60, "progress_percentage": 0.0},
        headers=auth_headers,
    )
    assert t1_resp.status_code == 201
    topic1_id = t1_resp.json()["id"]

    t2_resp = client.post(
        f"/subjects/{subject_id}/topics",
        json={"name": "Random Forest", "difficulty": 3, "estimated_minutes": 120, "progress_percentage": 0.0},
        headers=auth_headers,
    )
    assert t2_resp.status_code == 201

    # 4. Add Exam
    exam_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    e_resp = client.post(
        f"/subjects/{subject_id}/exams",
        json={"title": "Midterm Exam", "exam_date": exam_date, "duration_minutes": 180, "weightage": 40.0},
        headers=auth_headers,
    )
    assert e_resp.status_code == 201

    # 5. Add Assignment
    deadline = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    a_resp = client.post(
        f"/subjects/{subject_id}/assignments",
        json={"title": "Assignment 1: Regression Analysis", "deadline": deadline, "estimated_minutes": 90, "difficulty": 2},
        headers=auth_headers,
    )
    assert a_resp.status_code == 201


def test_study_availability_and_scheduler(client: TestClient, auth_headers: dict):
    # Setup classroom and subject
    c_resp = client.post("/classrooms", json={"name": "Data Systems"}, headers=auth_headers)
    c_id = c_resp.json()["id"]
    s_resp = client.post(f"/classrooms/{c_id}/subjects", json={"name": "DBMS"}, headers=auth_headers)
    s_id = s_resp.json()["id"]
    client.post(f"/subjects/{s_id}/topics", json={"name": "Normalization", "difficulty": 2, "estimated_minutes": 90}, headers=auth_headers)

    # 1. Set Availability Slots
    slots = [
        {"day_of_week": 0, "start_time": "18:00", "end_time": "21:00", "available_minutes": 180},
        {"day_of_week": 1, "start_time": "18:00", "end_time": "21:00", "available_minutes": 180},
        {"day_of_week": 2, "start_time": "18:00", "end_time": "20:00", "available_minutes": 120},
    ]
    avail_resp = client.post("/availability", json={"slots": slots}, headers=auth_headers)
    assert avail_resp.status_code == 201
    assert len(avail_resp.json()) == 3

    # 2. Generate Plan
    plan_resp = client.post("/study-plan/generate", json={"days_ahead": 7}, headers=auth_headers)
    assert plan_resp.status_code == 201
    plan_data = plan_resp.json()
    assert plan_data["status"] == "ACTIVE"
    assert len(plan_data["sessions"]) > 0

    session_id = plan_data["sessions"][0]["id"]

    # 3. Complete Session
    comp_resp = client.post(
        f"/study-sessions/{session_id}/complete",
        json={"actual_minutes": 60, "completion_percentage": 100.0},
        headers=auth_headers,
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "COMPLETED"

    # 4. Adaptive Reschedule
    resched_resp = client.post("/study-plan/reschedule", json={"reason": "Test catch up"}, headers=auth_headers)
    assert resched_resp.status_code == 200
    assert resched_resp.json()["version"] >= 2


def test_dashboard_and_analytics(client: TestClient, auth_headers: dict):
    # Setup some data
    c_resp = client.post("/classrooms", json={"name": "AI Studies"}, headers=auth_headers)
    c_id = c_resp.json()["id"]
    s_resp = client.post(f"/classrooms/{c_id}/subjects", json={"name": "Artificial Intelligence"}, headers=auth_headers)
    s_id = s_resp.json()["id"]
    client.post(f"/subjects/{s_id}/topics", json={"name": "A* Search", "difficulty": 2, "estimated_minutes": 60}, headers=auth_headers)

    # Generate plan
    client.post("/study-plan/generate", json={"days_ahead": 7}, headers=auth_headers)

    # 1. Fetch Dashboard
    d_resp = client.get("/dashboard", headers=auth_headers)
    assert d_resp.status_code == 200
    d_data = d_resp.json()
    assert "overall_progress" in d_data
    assert "study_deficit" in d_data
    assert "weak_subjects" in d_data

    # 2. Fetch Analytics
    a_resp = client.get("/analytics", headers=auth_headers)
    assert a_resp.status_code == 200
    a_data = a_resp.json()
    assert "prediction" in a_data
    assert a_data["prediction"]["syllabus_completion_probability"] >= 0


def test_notes_upload_and_rag(client: TestClient, auth_headers: dict):
    # Setup
    c_resp = client.post("/classrooms", json={"name": "Software Eng"}, headers=auth_headers)
    c_id = c_resp.json()["id"]
    s_resp = client.post(f"/classrooms/{c_id}/subjects", json={"name": "Design Patterns"}, headers=auth_headers)
    s_id = s_resp.json()["id"]

    # 1. Upload sample text note
    note_content = b"The Singleton Pattern ensures a class has only one instance and provides a global point of access to it."
    files = {"file": ("singleton_notes.txt", io.BytesIO(note_content), "text/plain")}
    data = {"title": "Singleton Pattern Guide"}
    upload_resp = client.post(f"/subjects/{s_id}/notes", files=files, data=data, headers=auth_headers)
    assert upload_resp.status_code == 201
    note_data = upload_resp.json()
    assert note_data["processing_status"] == "READY"
    assert note_data["chunk_count"] > 0

    # 2. Query RAG
    rag_resp = client.post(
        "/rag/query",
        json={"question": "What is the Singleton Pattern?", "subject_id": s_id},
        headers=auth_headers,
    )
    assert rag_resp.status_code == 200
    rag_data = rag_resp.json()
    assert "answer" in rag_data
    assert len(rag_data["citations"]) > 0


def test_quizzes_and_ai_assistant(client: TestClient, auth_headers: dict):
    # Setup
    c_resp = client.post("/classrooms", json={"name": "Networking"}, headers=auth_headers)
    c_id = c_resp.json()["id"]
    s_resp = client.post(f"/classrooms/{c_id}/subjects", json={"name": "Computer Networks"}, headers=auth_headers)
    s_id = s_resp.json()["id"]

    # 1. Generate Quiz
    quiz_resp = client.post(
        "/quizzes/generate",
        json={"subject_id": s_id, "topic_name": "TCP/IP Protocol", "num_questions": 2},
        headers=auth_headers,
    )
    assert quiz_resp.status_code == 201
    quiz_data = quiz_resp.json()
    assert len(quiz_data["questions"]) >= 1
    q_id = quiz_data["questions"][0]["id"]

    # 2. Submit Quiz
    sub_resp = client.post(
        f"/quizzes/{quiz_data['id']}/submit",
        json={"answers": {q_id: "A"}},
        headers=auth_headers,
    )
    assert sub_resp.status_code == 200
    assert "percentage" in sub_resp.json()

    # 3. AI Assistant Chat
    chat_resp = client.post(
        "/ai/chat",
        json={"message": "What should I focus on for Computer Networks?", "mode": "planning"},
        headers=auth_headers,
    )
    assert chat_resp.status_code == 200
    assert "reply" in chat_resp.json()

    # 4. AI Timetable Extraction
    sample_timetable = "Machine Learning Exam on 2026-11-20 at 10:00 for 180 minutes."
    tt_resp = client.post("/ai/timetable/extract", json={"raw_text": sample_timetable}, headers=auth_headers)
    assert tt_resp.status_code == 200

    # 5. Live Audio Guidance Endpoint
    audio_resp = client.post(
        "/ai/audio/guidance",
        json={"prompt": "How do I balance studying DBMS and Machine Learning?"},
        headers=auth_headers,
    )
    assert audio_resp.status_code == 200
    assert "transcript_guidance" in audio_resp.json()
