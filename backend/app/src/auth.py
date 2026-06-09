"""
auth.py — JWT + password hashing using Python stdlib only (no extra pip deps).

JWT:  HS256 implemented with hmac + hashlib + base64
Passwords: PBKDF2-HMAC-SHA256 with 260,000 iterations (NIST recommended)
Google:  ID-token verification via google-auth (already in env)
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# ── Config ────────────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "kawe-dev-secret-CHANGE-IN-PRODUCTION")
JWT_EXPIRY_SECONDS = int(os.getenv("JWT_EXPIRY_SECONDS", str(7 * 24 * 3600)))  # 7 days
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

_security = HTTPBearer(auto_error=False)

# ── JWT (stdlib only) ─────────────────────────────────────────────────────────
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * pad)

def create_access_token(user_id: str, email: str, name: str = "") -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url(json.dumps({
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_SECONDS,
    }).encode())
    signing_input = f"{header}.{payload}".encode()
    sig = _b64url(hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def decode_access_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Malformed token")
    header, payload_b64, sig = parts
    # Verify signature
    signing_input = f"{header}.{payload_b64}".encode()
    expected_sig = _b64url(hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected_sig):
        raise ValueError("Invalid signature")
    # Decode payload
    payload = json.loads(_b64url_decode(payload_b64))
    # Check expiry
    if time.time() > payload.get("exp", 0):
        raise ValueError("Token expired")
    return payload

# ── Password hashing (stdlib only) ───────────────────────────────────────────
_PBKDF2_ITERATIONS = 260_000

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS)
    return f"pbkdf2$sha256${_PBKDF2_ITERATIONS}${salt}${dk.hex()}"

def verify_password(plain: str, stored: str) -> bool:
    try:
        _, algo, iters, salt, stored_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac(algo, plain.encode(), salt.encode(), int(iters))
        return hmac.compare_digest(dk.hex(), stored_hex)
    except Exception:
        return False

# ── Google OAuth token verification ──────────────────────────────────────────
def verify_google_id_token(credential: str) -> dict:
    """Verify a Google ID token and return the payload."""
    if not GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured on the server.")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
        return idinfo  # contains: sub, email, name, picture, email_verified
    except Exception as e:
        raise ValueError(f"Google token verification failed: {e}")

# ── FastAPI dependency ────────────────────────────────────────────────────────
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_security),
) -> dict:
    """Decode JWT from Authorization header and return {id, email, name}."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
        return {
            "id": payload["sub"],
            "email": payload["email"],
            "name": payload.get("name", ""),
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
