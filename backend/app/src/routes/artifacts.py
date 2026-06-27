from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from db.database import get_db
from db.repositories import ArtifactRepository

from .common import _require_session

router = APIRouter()


class QuizRequest(BaseModel):
    num_questions: int = 5
    difficulty: str = "medium"


@router.post("/api/sessions/{session_id}/notes")
def api_generate_notes(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    session = _require_session(session_id, current_user["id"])

    try:
        notes = repo.generate_notes(session_id, session["title"])
        repo.save_artifact(session_id, "notes", notes)
        return notes
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/notes")
def api_get_notes(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    _require_session(session_id, current_user["id"])
    notes = repo.get_artifact(session_id, "notes")
    if not notes:
        raise HTTPException(status_code=404, detail="Notes not generated yet")
    return notes


@router.post("/api/sessions/{session_id}/quiz")
def api_generate_quiz(
    session_id: str,
    req: QuizRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    session = _require_session(session_id, current_user["id"])
    from ai.generation import generate_quiz

    try:
        quiz = generate_quiz(
            session_id, session["title"], req.num_questions, req.difficulty
        )
        repo.save_artifact(session_id, "quiz", quiz)
        return quiz
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/quiz")
def api_get_quiz(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    _require_session(session_id, current_user["id"])
    quiz = repo.get_artifact(session_id, "quiz")
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not generated yet")
    return quiz


@router.post("/api/sessions/{session_id}/flashcards")
def api_generate_flashcards(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    session = _require_session(session_id, current_user["id"])
    from ai.generation import generate_flashcards

    try:
        deck = generate_flashcards(session_id, session["title"])
        repo.save_artifact(session_id, "flashcards", deck)
        return deck
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/flashcards")
def api_get_flashcards(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    _require_session(session_id, current_user["id"])
    deck = repo.get_artifact(session_id, "flashcards")
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcards not generated yet")
    return deck


@router.post("/api/sessions/{session_id}/concepts")
def api_generate_concepts(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    session = _require_session(session_id, current_user["id"])
    from ai.generation import generate_concepts

    try:
        concepts = generate_concepts(session_id, session["title"])
        repo.save_artifact(session_id, "concepts", concepts)
        return concepts
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/concepts")
def api_get_concepts(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ArtifactRepository(db=db)
    _require_session(session_id, current_user["id"])
    concepts = repo.get_artifact(session_id, "concepts")
    if not concepts:
        raise HTTPException(status_code=404, detail="Concepts not generated yet")
    return concepts
