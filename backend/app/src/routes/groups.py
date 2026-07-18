import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from db.database import get_db
from db.repositories import CourseRepository, GroupRepository, UserRepository

router = APIRouter()


class CreateGroupRequest(BaseModel):
    name: str


class JoinGroupRequest(BaseModel):
    code: str


class JoinCourseRequest(BaseModel):
    code: str


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    subject_area: list[str] | None = None
    academic_level: str | None = None
    institution: str | None = None
    group_id: str | None = None
    course_id: str | None = None
    has_onboarded: bool | None = None


@router.post("/api/groups")
def api_create_group(
    req: CreateGroupRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Group name cannot be empty.")
    repo = GroupRepository(db=db)
    group_id = f"grp_{uuid.uuid4().hex[:12]}"
    return repo.create_group(group_id, req.name.strip(), created_by=current_user["id"])


@router.post("/api/groups/join")
def api_join_group(
    req: JoinGroupRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = GroupRepository(db=db)
    group = repo.join_group(req.code.strip(), current_user["id"])
    if not group:
        raise HTTPException(status_code=404, detail="No group found with that code.")
    return group


@router.post("/api/courses/join")
def api_join_course(
    req: JoinCourseRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = CourseRepository(db=db)
    course = repo.join_course(req.code.strip(), current_user["id"])
    if not course:
        raise HTTPException(status_code=404, detail="No course found with that code.")
    return course


@router.put("/api/users/me")
def api_update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db=db)
    payload = req.model_dump(exclude_none=True)
    # Remove group_id/course_id — those are managed via join endpoints, not direct writes
    payload.pop("group_id", None)
    payload.pop("course_id", None)
    repo.update_profile(current_user["id"], payload)
    return {"ok": True}
