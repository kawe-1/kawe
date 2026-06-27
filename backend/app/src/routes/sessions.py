import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from db.database import get_db
from db.repositories import ArtifactRepository, SessionRepository, SourceRepository

router = APIRouter()


class CreateSessionRequest(BaseModel):
    title: str


@router.post("/api/sessions")
def api_create_session(
    req: CreateSessionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = SessionRepository(db=db)
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    repo.create_session(session_id, req.title, user_id=current_user["id"])
    return {
        "id": session_id,
        "title": req.title,
        "created_at": None,
        "sources": [],
        "artifacts": {},
    }


@router.get("/api/sessions")
def api_list_sessions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = SessionRepository(db=db)
    return repo.list_sessions_for_user(current_user["id"])


@router.get("/api/sessions/{session_id}")
def api_get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session_repo = SessionRepository(db=db)
    source_repo = SourceRepository(db=db)
    artifact_repo = ArtifactRepository(db=db)

    session = session_repo.get_session(session_id)
    if not session or session.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")

    sources = source_repo.list_sources(session_id)
    artifacts = {
        key: artifact_repo.get_artifact(session_id, key) is not None
        for key in ("notes", "quiz", "flashcards", "concepts")
    }
    return {
        "id": session["id"],
        "title": session["title"],
        "sources": sources,
        "artifacts": artifacts,
    }


@router.delete("/api/sessions/{session_id}")
def api_delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = SessionRepository(db=db)
    session = repo.get_session(session_id)
    if not session or session.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")

    repo.delete_session(session_id)
    for folder in [f"data/uploads/{session_id}", f"data/vector_stores/{session_id}"]:
        if os.path.exists(folder):
            try:
                shutil.rmtree(folder)
            except OSError:
                pass

    return {"message": "Session deleted"}
