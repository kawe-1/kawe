import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from db import (
    create_session,
    delete_session,
    get_artifact,
    get_session,
    list_sessions_for_user,
    list_sources,
)

router = APIRouter()


class CreateSessionRequest(BaseModel):
    title: str


@router.post("/api/sessions")
def api_create_session(
    req: CreateSessionRequest, current_user: dict = Depends(get_current_user)
):
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    create_session(session_id, req.title, user_id=current_user["id"])
    return {
        "id": session_id,
        "title": req.title,
        "created_at": None,
        "sources": [],
        "artifacts": {},
    }


@router.get("/api/sessions")
def api_list_sessions(current_user: dict = Depends(get_current_user)):
    return list_sessions_for_user(current_user["id"])


@router.get("/api/sessions/{session_id}")
def api_get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session(session_id)
    if not session or session.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")

    sources = list_sources(session_id)
    artifacts = {
        "notes": get_artifact(session_id, "notes") is not None,
        "quiz": get_artifact(session_id, "quiz") is not None,
        "flashcards": get_artifact(session_id, "flashcards") is not None,
        "concepts": get_artifact(session_id, "concepts") is not None,
    }
    return {
        "id": session["id"],
        "title": session["title"],
        "sources": sources,
        "artifacts": artifacts,
    }


@router.delete("/api/sessions/{session_id}")
def api_delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session(session_id)
    if not session or session.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")

    delete_session(session_id)
    for folder in [f"data/uploads/{session_id}", f"data/vector_stores/{session_id}"]:
        if os.path.exists(folder):
            try:
                shutil.rmtree(folder)
            except OSError:
                pass

    return {"message": "Session deleted"}
