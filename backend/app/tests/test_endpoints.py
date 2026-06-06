import sys
import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

# Set environment variables for test database
os.environ["SQLITE_DB_PATH"] = "data/test_kawe.db"

from main import app
import db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    # Setup test DB
    if os.path.exists("data/test_kawe.db"):
        try:
            os.remove("data/test_kawe.db")
        except OSError:
            pass
    db.init_db()
    yield
    # Teardown test DB
    if os.path.exists("data/test_kawe.db"):
        try:
            os.remove("data/test_kawe.db")
        except OSError:
            pass


def test_session_lifecycle():
    # 1. Create a session
    resp = client.post("/api/sessions", json={"title": "Introduction to AI"})
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["title"] == "Introduction to AI"
    session_id = data["id"]

    # 2. List sessions
    resp = client.get("/api/sessions")
    assert resp.status_code == 200
    sessions = resp.json()
    assert len(sessions) == 1
    assert sessions[0]["id"] == session_id

    # 3. Get session details
    resp = client.get(f"/api/sessions/{session_id}")
    assert resp.status_code == 200
    details = resp.json()
    assert details["id"] == session_id
    assert details["title"] == "Introduction to AI"
    assert "sources" in details
    assert "artifacts" in details
    assert details["artifacts"]["notes"] is False

    # 4. Delete session
    resp = client.delete(f"/api/sessions/{session_id}")
    assert resp.status_code == 200
    
    # 5. Verify deleted
    resp = client.get(f"/api/sessions/{session_id}")
    assert resp.status_code == 404


def test_source_ingestion_endpoints(monkeypatch):
    # Mock background tasks to prevent actual run
    monkeypatch.setattr("routes.background_ingest_source", lambda *a, **k: None)

    # Create session
    resp = client.post("/api/sessions", json={"title": "RAG Session"})
    session_id = resp.json()["id"]

    # 1. Ingest YouTube URL
    resp = client.post(
        f"/api/sessions/{session_id}/sources/youtube",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert "source_id" in data
    source_id = data["source_id"]

    # 2. Ingest Document
    dummy_file = ("test_doc.pdf", b"%PDF-1.4 dummy contents", "application/pdf")
    resp = client.post(
        f"/api/sessions/{session_id}/sources/document",
        files={"file": dummy_file}
    )
    assert resp.status_code == 200
    assert "source_id" in resp.json()

    # 3. List sources
    resp = client.get(f"/api/sessions/{session_id}/sources")
    assert resp.status_code == 200
    sources = resp.json()
    assert len(sources) == 2

    # 4. Delete source
    resp = client.delete(f"/api/sources/{source_id}")
    assert resp.status_code == 200

    # 5. List sources again
    resp = client.get(f"/api/sessions/{session_id}/sources")
    assert len(resp.json()) == 1


def test_artifact_generation(monkeypatch):
    # Create session
    resp = client.post("/api/sessions", json={"title": "Artifacts"})
    session_id = resp.json()["id"]

    # Mock generation methods
    monkeypatch.setattr(
        "ai.generation.generate_notes",
        lambda sess_id, title: {"title": "Test Notes", "overview": "Overview", "key_points": ["Point 1"]}
    )
    monkeypatch.setattr(
        "ai.generation.generate_quiz",
        lambda sess_id, title, num, diff: {"quizzes": [{"question": "Q1", "choices": ["A", "B"], "correct_answer": "A", "explanation": "exp"}]}
    )
    monkeypatch.setattr(
        "ai.generation.generate_flashcards",
        lambda sess_id, title: {"flashcards": [{"front": "Front 1", "back": "Back 1"}]}
    )
    monkeypatch.setattr(
        "ai.generation.generate_concepts",
        lambda sess_id, title: {"concepts": [{"concept": "C1", "simplified_explanation": "S1", "analogy": "A1"}]}
    )

    # 1. Notes API
    resp = client.get(f"/api/sessions/{session_id}/notes")
    assert resp.status_code == 404 # Not generated yet
    
    resp = client.post(f"/api/sessions/{session_id}/notes")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test Notes"
    
    resp = client.get(f"/api/sessions/{session_id}/notes")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test Notes"

    # 2. Quiz API
    resp = client.post(f"/api/sessions/{session_id}/quiz", json={"num_questions": 3, "difficulty": "hard"})
    assert resp.status_code == 200
    assert len(resp.json()["quizzes"]) == 1

    resp = client.get(f"/api/sessions/{session_id}/quiz")
    assert resp.status_code == 200

    # 3. Flashcards API
    resp = client.post(f"/api/sessions/{session_id}/flashcards")
    assert resp.status_code == 200
    assert len(resp.json()["flashcards"]) == 1

    resp = client.get(f"/api/sessions/{session_id}/flashcards")
    assert resp.status_code == 200

    # 4. Concepts API
    resp = client.post(f"/api/sessions/{session_id}/concepts")
    assert resp.status_code == 200
    assert len(resp.json()["concepts"]) == 1

    resp = client.get(f"/api/sessions/{session_id}/concepts")
    assert resp.status_code == 200


def test_ai_tutor_chat(monkeypatch):
    resp = client.post("/api/sessions", json={"title": "Tutor Session"})
    session_id = resp.json()["id"]

    monkeypatch.setattr(
        "ai.generation.generate_rag_response",
        lambda sess_id, query: {"answer": "AI Response to " + query, "sources": []}
    )

    # 1. Send chat message
    resp = client.post(f"/api/sessions/{session_id}/chat", json={"message": "What is RAG?"})
    assert resp.status_code == 200
    assert resp.json()["answer"] == "AI Response to What is RAG?"

    # 2. Get chat history
    resp = client.get(f"/api/sessions/{session_id}/chat")
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["message"] == "What is RAG?"
    assert history[1]["role"] == "assistant"
    assert history[1]["message"] == "AI Response to What is RAG?"


def test_voice_query_and_job_status(monkeypatch):
    resp = client.post("/api/sessions", json={"title": "Voice Session"})
    session_id = resp.json()["id"]

    # Mock transcription & generation
    class FakeResult:
        text = "Hello tutor"
    monkeypatch.setattr("routes.MockProvider.transcribe", lambda self, p: FakeResult())
    monkeypatch.setattr(
        "ai.generation.generate_rag_response",
        lambda sess_id, query: {"answer": "Voice Response", "sources": []}
    )
    monkeypatch.setattr("routes.generate_speech", lambda text: b"audio content")

    # 1. Post voice query
    resp = client.post(
        f"/api/sessions/{session_id}/voice",
        data=b"mock-webm-binary-audio-payload",
        headers={"Content-Type": "audio/webm"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["transcript"] == "Hello tutor"
    assert data["answer"] == "Voice Response"
    assert "audio_url" in data

    # 2. Get job status
    db.create_job("job_123", "completed")
    db.update_job("job_123", "completed", result={"success": True})
    
    resp = client.get("/api/jobs/job_123")
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"
    assert resp.json()["result"]["success"] is True
