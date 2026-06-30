import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import (
    GOOGLE_CLIENT_ID,
    create_access_token,
    get_current_user,
    hash_password,
    verify_google_id_token,
    verify_password,
)
from db.database import get_db
from db.repositories import UserRepository

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from GSI


def _user_response(user: dict, token: str) -> dict:
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "has_onboarded": user["has_onboarded"],
        },
    }


@router.post("/api/auth/register")
def api_register(req: RegisterRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db=db)
    if len(req.password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters."
        )
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    existing = repo.get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=409, detail="An account with this email already exists."
        )
    user_id = f"usr_{uuid.uuid4().hex[:16]}"
    name = req.name.strip() or req.email.split("@")[0]
    repo.create_user(
        user_id, req.email, name, password_hash=hash_password(req.password)
    )
    token = create_access_token(user_id, req.email, name)
    return _user_response({"id": user_id, "email": req.email, "name": name}, token)


@router.post("/api/auth/login")
def api_login(req: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db=db)
    user = repo.get_user_by_email(req.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user["id"], user["email"], user["name"])
    return _user_response(user, token)


@router.post("/api/auth/google")
def api_google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db=db)
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google Sign-In is not configured on this server. Set GOOGLE_CLIENT_ID in your .env file.",
        )
    try:
        idinfo = verify_google_id_token(req.credential)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    name = idinfo.get("name", email.split("@")[0])

    user = repo.get_user_by_google_id(google_id)
    if not user:
        user = repo.get_user_by_email(email)
        if user:
            repo.update_user_google_id(user["id"], google_id)
        else:
            user_id = f"usr_{uuid.uuid4().hex[:16]}"
            repo.create_user(user_id, email, name, google_id=google_id)
            user = {"id": user_id, "email": email, "name": name}

    token = create_access_token(user["id"], user["email"], user.get("name", name))
    return _user_response(user, token)


@router.get("/api/auth/me")
def api_me(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    repo = UserRepository(db=db)
    user = repo.get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user["id"], "email": user["email"], "name": user["name"]}
