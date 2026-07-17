import os
import shutil
import uuid
from contextlib import suppress

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from db.database import get_db
from db.repositories import (
    ArtifactRepository,
    CourseRepository,
    GroupRepository,
    SessionRepository,
    SourceRepository,
)

router = APIRouter()


class CreateSessionRequest(BaseModel):
    title: str
    workspace_id: str | None = None
    workspace_type: str | None = None


@router.post("/api/sessions")
def api_create_session(
    req: CreateSessionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = SessionRepository(db=db)
    group_repo = GroupRepository(db=db)
    course_repo = CourseRepository(db=db)

    group_id = None
    course_id = None
    user_id = None
    if req.workspace_type == "study_group" and req.workspace_id:
        user_group = group_repo.get_group_for_user(current_user["id"])
        if not user_group or user_group["id"] != req.workspace_id:
            raise HTTPException(status_code=403, detail="Not a member of that group.")
        group_id = req.workspace_id
    elif req.workspace_type == "course_group" and req.workspace_id:
        user_course = course_repo.get_course_for_user(current_user["id"])
        if not user_course or user_course["id"] != req.workspace_id:
            raise HTTPException(status_code=403, detail="Not enrolled in that class.")
        course_id = req.workspace_id
    else:
        user_id = current_user["id"]

    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    repo.create_session(
        session_id,
        req.title,
        created_by=current_user["id"],
        user_id=user_id,
        group_id=group_id,
        course_id=course_id,
    )
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
    workspace_id: str | None = None,
    workspace_type: str | None = None,
    db: Session = Depends(get_db),
):
    repo = SessionRepository(db=db)
    group_repo = GroupRepository(db=db)
    course_repo = CourseRepository(db=db)

    if workspace_type == "study_group" and workspace_id:
        user_group = group_repo.get_group_for_user(current_user["id"])
        if not user_group or user_group["id"] != workspace_id:
            raise HTTPException(status_code=403, detail="Not a member of that group.")
        return repo.list_sessions_for_group(workspace_id)

    if workspace_type == "course_group" and workspace_id:
        user_course = course_repo.get_course_for_user(current_user["id"])
        if not user_course or user_course["id"] != workspace_id:
            raise HTTPException(status_code=403, detail="Not enrolled in that class.")
        return repo.list_sessions_for_course(workspace_id)

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
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    allowed = session.get("user_id") == current_user["id"]
    if not allowed and session.get("group_id"):
        user_group = GroupRepository(db=db).get_group_for_user(current_user["id"])
        allowed = bool(user_group and user_group["id"] == session.get("group_id"))
    if not allowed and session.get("course_id"):
        user_course = CourseRepository(db=db).get_course_for_user(current_user["id"])
        allowed = bool(user_course and user_course["id"] == session.get("course_id"))
    if not allowed:
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
            with suppress(OSError):
                shutil.rmtree(folder)

    return {"message": "Session deleted"}
