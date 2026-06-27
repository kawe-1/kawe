"""
repositories.py
---------------
One repository class per domain model. Each takes an SQLAlchemy Session
and exposes only the operations that exist in the original db.py, plus
clean upsert support for Artifact.

Usage (plain Python / FastAPI):

    from database import SessionLocal
    from repositories import UserRepository

    with SessionLocal() as db:
        repo = UserRepository(db)
        user = repo.get_by_email("simeon@example.com")
"""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from .models import Artifact, ChatMessage, Job, Source, StudySession, User

# ── Helpers ───────────────────────────────────────────────────────────────────


def _to_dict(obj) -> dict:
    """Convert a mapped instance to a plain dict (mirrors old dict(row) pattern)."""
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


# ── User ──────────────────────────────────────────────────────────────────────


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_user(
        self,
        user_id: str,
        email: str,
        name: str,
        password_hash: Optional[str] = None,
        google_id: Optional[str] = None,
    ) -> dict[str, Any]:
        user = User(
            id=user_id,
            email=email.lower().strip(),
            name=name,
            password_hash=password_hash,
            google_id=google_id,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return _to_dict(user)

    def get_user_by_id(self, user_id: str) -> Optional[dict[str, Any]]:
        user = self.db.get(User, user_id)
        return _to_dict(user) if user else None

    def get_user_by_email(self, email: str) -> Optional[dict[str, Any]]:
        user = self.db.scalar(select(User).where(User.email == email.lower().strip()))
        return _to_dict(user) if user else None

    def get_user_by_google_id(self, google_id: str) -> Optional[dict[str, Any]]:
        user = self.db.scalar(select(User).where(User.google_id == google_id))
        return _to_dict(user) if user else None

    def update_user_google_id(self, user_id: str, google_id: str) -> None:
        user = self.db.get(User, user_id)
        if user:
            user.google_id = google_id
            self.db.commit()


# ── StudySession ──────────────────────────────────────────────────────────────


class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(
        self,
        session_id: str,
        title: str,
        user_id: Optional[str] = None,
    ) -> dict[str, Any]:
        session = StudySession(id=session_id, title=title, user_id=user_id)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return _to_dict(session)

    def get_session(self, session_id: str) -> Optional[dict[str, Any]]:
        session = self.db.get(StudySession, session_id)
        return _to_dict(session) if session else None

    def list_sessions_for_user(self, user_id: str) -> list[dict[str, Any]]:
        rows = self.db.scalars(
            select(StudySession)
            .where(StudySession.user_id == user_id)
            .order_by(StudySession.created_at.desc())
        ).all()
        return [_to_dict(r) for r in rows]

    def list_all(self) -> list[dict[str, Any]]:
        """Legacy: returns every session regardless of user."""
        rows = self.db.scalars(
            select(StudySession).order_by(StudySession.created_at.desc())
        ).all()
        return [_to_dict(r) for r in rows]

    def delete_session(self, session_id: str) -> None:
        session = self.db.get(StudySession, session_id)
        if session:
            self.db.delete(session)
            self.db.commit()


# ── Source ────────────────────────────────────────────────────────────────────


class SourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_source(
        self,
        source_id: str,
        session_id: str,
        name: str,
        source_type: str,
        path_or_url: str,
        status: str = "pending",
    ) -> dict[str, Any]:
        source = Source(
            id=source_id,
            session_id=session_id,
            name=name,
            source_type=source_type,
            path_or_url=path_or_url,
            status=status,
        )
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        return _to_dict(source)

    def get_source(self, source_id: str) -> Optional[dict[str, Any]]:
        source = self.db.get(Source, source_id)
        return _to_dict(source) if source else None

    def list_sources(self, session_id: str) -> list[dict[str, Any]]:
        rows = self.db.scalars(
            select(Source)
            .where(Source.session_id == session_id)
            .order_by(Source.created_at.desc())
        ).all()
        return [_to_dict(r) for r in rows]

    def update_source_status(self, source_id: str, status: str) -> None:
        source = self.db.get(Source, source_id)
        if source:
            source.status = status
            self.db.commit()

    def delete(self, source_id: str) -> None:
        source = self.db.get(Source, source_id)
        if source:
            self.db.delete(source)
            self.db.commit()


# ── Artifact ──────────────────────────────────────────────────────────────────


class ArtifactRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_artifact(
        self, session_id: str, artifact_type: str, content: dict[str, Any]
    ) -> None:
        """Upsert: insert or replace content on conflict."""
        stmt = (
            pg_insert(Artifact)
            .values(
                session_id=session_id,
                artifact_type=artifact_type,
                content=content,
            )
            .on_conflict_do_update(
                index_elements=["session_id", "artifact_type"],
                set_={"content": content},
            )
        )
        self.db.execute(stmt)
        self.db.commit()

    def get_artifact(
        self, session_id: str, artifact_type: str
    ) -> Optional[dict[str, Any]]:
        artifact = self.db.get(Artifact, (session_id, artifact_type))
        # Return the JSONB content dict directly (no json.loads needed)
        return artifact.content if artifact else None


# ── ChatMessage ───────────────────────────────────────────────────────────────


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_chat_message(
        self, message_id: str, session_id: str, role: str, message: str
    ) -> dict[str, Any]:
        msg = ChatMessage(
            id=message_id, session_id=session_id, role=role, message=message
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return _to_dict(msg)

    def get_chat_history(self, session_id: str) -> list[dict[str, Any]]:
        rows = self.db.scalars(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        ).all()
        return [_to_dict(r) for r in rows]


# ── Job ───────────────────────────────────────────────────────────────────────


class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_job(self, job_id: str, status: str = "processing") -> dict[str, Any]:
        job = Job(id=job_id, status=status)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return _to_dict(job)

    def update_job(
        self,
        job_id: str,
        status: str,
        result: Optional[dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> None:
        job = self.db.get(Job, job_id)
        if job:
            job.status = status
            job.result = result
            job.error = error
            self.db.commit()

    def get_job(self, job_id: str) -> Optional[dict[str, Any]]:
        job = self.db.get(Job, job_id)
        return _to_dict(job) if job else None
