from fastapi import HTTPException
from sqlalchemy.orm import Session

from db.repositories import SessionRepository

MAX_FILE_SIZE = 20_971_520


def _require_session(session_id: str, user_id: str, db: Session):
    repo = SessionRepository(db=db)
    session = repo.get_session(session_id)
    if not session or session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
