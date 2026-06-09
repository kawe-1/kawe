import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_current_user
from db import add_chat_message, get_chat_history

from .common import _require_session

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/api/sessions/{session_id}/chat")
def api_chat(
    session_id: str, req: ChatRequest, current_user: dict = Depends(get_current_user)
):
    session = _require_session(session_id, current_user["id"])
    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    add_chat_message(user_msg_id, session_id, "user", req.message)

    from ai.generation import generate_rag_response

    res = generate_rag_response(session_id, req.message)

    # --- FIX START: Sanitize 'answer' to guarantee it's a string ---
    answer_content = res.get("answer", "")

    if isinstance(answer_content, list):
        # Join list items into a cleanly spaced string block
        answer_content = "\n".join(str(item) for item in answer_content)
    elif isinstance(answer_content, dict):
        # Fallback for structured dictionary data payloads
        import json

        answer_content = json.dumps(answer_content)
    else:
        # Fallback to catch everything else smoothly
        answer_content = str(answer_content)
    # --- FIX END ---

    asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"

    # Save the strictly verified string to your database
    add_chat_message(asst_msg_id, session_id, "assistant", answer_content)

    return res


@router.get("/api/sessions/{session_id}/chat")
def api_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    _require_session(session_id, current_user["id"])
    history = get_chat_history(session_id)
    return [
        {"role": h["role"], "message": h["message"], "created_at": h["created_at"]}
        for h in history
    ]
