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

import secrets
import string
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from .models import (
    Artifact,
    ChatMessage,
    Course,
    CourseMember,
    Group,
    GroupMember,
    Job,
    Source,
    StudySession,
    User,
)

# ── Helpers ───────────────────────────────────────────────────────────────────


def _to_dict(obj) -> dict:
    """Convert a mapped instance to a plain dict (mirrors old dict(row) pattern)."""
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def _generate_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    raw = "".join(secrets.choice(chars) for _ in range(length))
    return f"KW-{raw}"


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

    def update_profile(self, user_id: str, payload: dict) -> None:
        user = self.db.get(User, user_id)
        if not user:
            return
        allowed = {
            "name",
            "academic_level",
            "institution",
            "subject_area",
            "has_onboarded",
        }
        for key, val in payload.items():
            if key in allowed:
                setattr(user, key, val)
        self.db.commit()


# ── StudySession ──────────────────────────────────────────────────────────────


class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(
        self,
        session_id: str,
        title: str,
        created_by: str,
        user_id: Optional[str] = None,
        group_id: Optional[str] = None,
        course_id: Optional[str] = None,
    ) -> dict[str, Any]:
        session = StudySession(
            id=session_id,
            title=title,
            user_id=user_id,
            group_id=group_id,
            course_id=course_id,
            created_by=created_by,
        )
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
            .where(
                StudySession.user_id == user_id,
                StudySession.group_id.is_(None),
                StudySession.course_id.is_(None),
            )
            .order_by(StudySession.created_at.desc())
        ).all()
        return [_to_dict(r) for r in rows]

    def list_sessions_for_group(self, group_id: str) -> list[dict[str, Any]]:
        rows = self.db.scalars(
            select(StudySession)
            .where(StudySession.group_id == group_id)
            .order_by(StudySession.created_at.desc())
        ).all()
        return [_to_dict(r) for r in rows]

    def list_sessions_for_course(self, course_id: str) -> list[dict[str, Any]]:
        rows = self.db.scalars(
            select(StudySession)
            .where(StudySession.course_id == course_id)
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


class GroupRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_group(self, group_id: str, name: str, created_by: str) -> dict[str, Any]:
        # Ensure unique code
        while True:
            code = _generate_code()
            existing = self.db.scalar(select(Group).where(Group.code == code))
            if not existing:
                break

        group = Group(id=group_id, name=name, code=code, created_by=created_by)
        self.db.add(group)

        # Creator becomes admin member
        member = GroupMember(group_id=group_id, user_id=created_by, role="owner")
        self.db.add(member)
        self.db.commit()
        self.db.refresh(group)

        return {
            "id": group.id,
            "name": group.name,
            "code": group.code,
            "memberCount": 1,
            "role": "owner",
        }

    def join_group(self, code: str, user_id: str) -> dict[str, Any]:
        group = self.db.scalar(select(Group).where(Group.code == code.upper()))
        if not group:
            return None

        # Idempotent — don't double-add
        membership = self.db.get(GroupMember, (group.id, user_id))
        if not membership:
            membership = GroupMember(group_id=group.id, user_id=user_id, role="member")
            self.db.add(membership)
            self.db.commit()

        member_count = len(
            self.db.scalars(
                select(GroupMember).where(GroupMember.group_id == group.id)
            ).all()
        )

        return {
            "id": group.id,
            "name": group.name,
            "code": group.code,
            "memberCount": member_count,
            "role": membership.role,
        }

    def get_group_for_user(self, user_id: str) -> Optional[dict[str, Any]]:
        membership = self.db.scalar(
            select(GroupMember).where(GroupMember.user_id == user_id)
        )
        if not membership:
            return None
        group = self.db.get(Group, membership.group_id)
        if not group:
            return None
        member_count = len(
            self.db.scalars(
                select(GroupMember).where(GroupMember.group_id == group.id)
            ).all()
        )
        return {
            "id": group.id,
            "name": group.name,
            "code": group.code,
            "memberCount": member_count,
            "role": membership.role,
        }

    def make_admin(self, group_id: str, user_id: str) -> bool:
        """Promote a member to admin. Returns True if successful."""
        membership = self.db.get(GroupMember, (group_id, user_id))
        if not membership:
            return False

        if membership.role == "owner":
            return False  # Owner can't be demoted via make_admin

        membership.role = "admin"
        self.db.commit()
        return True

    def make_owner(
        self, group_id: str, new_owner_id: str, current_owner_id: str
    ) -> bool:
        """Transfer ownership from current owner to new user.
        Returns True if successful."""

        # Verify current user is owner
        current_role = self.get_role(group_id, current_owner_id)
        if current_role != "owner":
            return False

        # Get both memberships
        old_owner = self.db.get(GroupMember, (group_id, current_owner_id))
        new_owner = self.db.get(GroupMember, (group_id, new_owner_id))

        if not old_owner or not new_owner:
            return False

        # Transfer ownership
        old_owner.role = "admin"
        new_owner.role = "owner"

        self.db.commit()
        return True


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def join_course(self, code: str, user_id: str) -> Optional[dict[str, Any]]:
        course = self.db.scalar(select(Course).where(Course.code == code.upper()))
        if not course:
            return None

        existing = self.db.get(CourseMember, (course.id, user_id))
        if not existing:
            member = CourseMember(course_id=course.id, user_id=user_id)
            self.db.add(member)
            self.db.commit()

        member_count = len(
            self.db.scalars(
                select(CourseMember).where(CourseMember.course_id == course.id)
            ).all()
        )

        return {
            "id": course.id,
            "name": course.name,
            "code": course.code,
            "instructor": course.instructor,
            "memberCount": member_count,
        }

    def get_course_for_user(self, user_id: str) -> Optional[dict[str, Any]]:
        membership = self.db.scalar(
            select(CourseMember).where(CourseMember.user_id == user_id)
        )
        if not membership:
            return None
        course = self.db.get(Course, membership.course_id)
        if not course:
            return None
        member_count = len(
            self.db.scalars(
                select(CourseMember).where(CourseMember.course_id == course.id)
            ).all()
        )
        return {
            "id": course.id,
            "name": course.name,
            "code": course.code,
            "instructor": course.instructor,
            "memberCount": member_count,
        }
