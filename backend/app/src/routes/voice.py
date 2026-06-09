import base64
import json
import os
import shutil
import struct
import time as _time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response as FastResponse
from pydantic import BaseModel

from auth import get_current_user

from .common import _require_session

_AETHEX_TTS_LANGS = {"english", "french", "pidgin"}
router = APIRouter()


def synthesize_speech(text: str, language: str = "english") -> bytes:
    lang = language.lower()
    aethex_key = os.getenv("AETHEX_API_KEY", "")

    if aethex_key and lang in _AETHEX_TTS_LANGS:
        try:
            from services.aethex_tts import synthesize as _aethex

            return _aethex(text, language=lang)
        except Exception:
            # Logging is handled by the caller environment if needed.
            pass

    return _gemini_tts(text)


def _gemini_tts(text: str) -> bytes:
    from google import genai
    from google.genai import types

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return generate_dummy_wav()

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Read this educational response aloud clearly and naturally: {text}",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Puck"
                        )
                    )
                ),
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                data = part.inline_data.data
                return base64.b64decode(data) if isinstance(data, str) else data
        return generate_dummy_wav()
    except Exception:
        return generate_dummy_wav()


def generate_dummy_wav() -> bytes:
    sample_rate = 8000
    num_samples = sample_rate
    data_size = num_samples * 2
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        1,
        sample_rate,
        sample_rate * 2,
        2,
        16,
        b"data",
        data_size,
    )
    data = b"\x00" * data_size
    return header + data


@router.post("/api/sessions/{session_id}/voice")
async def api_voice_query(
    session_id: str,
    request: Request,
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    _require_session(session_id, current_user["id"])

    temp_dir = "data/static"
    os.makedirs(temp_dir, exist_ok=True)

    unique_id = uuid.uuid4().hex[:12]
    temp_audio_path = os.path.join(temp_dir, f"temp_{unique_id}.webm")

    if file:
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    else:
        body = await request.body()
        if not body:
            raise HTTPException(status_code=400, detail="Empty audio payload")
        with open(temp_audio_path, "wb") as f:
            f.write(body)

    transcript = ""
    try:
        from services.audio_ingester import GeminiTranscriptionProvider, MockProvider

        provider = (
            GeminiTranscriptionProvider()
            if os.getenv("GOOGLE_API_KEY")
            else MockProvider()
        )
        result = provider.transcribe(temp_audio_path)
        transcript = result.text
    except Exception:
        transcript = ""
    finally:
        if os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except OSError:
                pass

    if not transcript:
        transcript = "Hello"

    from ai.generation import generate_rag_response

    res = generate_rag_response(session_id, transcript)

    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    from db import add_chat_message

    add_chat_message(user_msg_id, session_id, "user", transcript)
    add_chat_message(asst_msg_id, session_id, "assistant", res["answer"])

    audio_bytes = synthesize_speech(res["answer"])
    output_audio_filename = f"voice_{unique_id}.wav"
    output_audio_path = os.path.join(temp_dir, output_audio_filename)
    with open(output_audio_path, "wb") as f:
        f.write(audio_bytes)

    return {
        "transcript": transcript,
        "answer": res["answer"],
        "audio_url": f"/static/{output_audio_filename}",
    }


@router.get("/api/voices")
def api_voices(language: str = "all", current_user: dict = Depends(get_current_user)):
    aethex_key = os.getenv("AETHEX_API_KEY", "")
    if not aethex_key:
        return []

    now = _time.time()
    if (
        getattr(api_voices, "_cache", None) is not None
        and (now - api_voices._cache["ts"]) < 300
    ):
        data = api_voices._cache["data"]
    else:
        try:
            import requests as _req

            params = {} if language == "all" else {"language": language}
            resp = _req.get(
                "https://api.aethexai.com/api/v1/voices",
                headers={"X-API-Key": aethex_key},
                params=params,
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            api_voices._cache = {"data": data, "ts": now}
        except Exception:
            return []

    return data


class TtsRequest(BaseModel):
    text: str
    language: str = "english"
    voice_id: Optional[str] = None


@router.post("/api/sessions/{session_id}/tts")
def api_tts(
    session_id: str,
    req: TtsRequest,
    current_user: dict = Depends(get_current_user),
):
    _require_session(session_id, current_user["id"])
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        aethex_key = os.getenv("AETHEX_API_KEY", "")
        lang = req.language.lower()
        if aethex_key and lang in _AETHEX_TTS_LANGS:
            from services.aethex_tts import synthesize as _aethex

            audio_bytes = _aethex(req.text, voice_id=req.voice_id, language=lang)
        else:
            audio_bytes = synthesize_speech(req.text, language=req.language)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return FastResponse(content=audio_bytes, media_type="audio/wav")


@router.post("/api/sessions/{session_id}/conversation")
async def api_conversation(
    session_id: str,
    request: Request,
    file: Optional[UploadFile] = File(None),
    language: str = Form("english"),
    history: str = Form("[]"),
    voice_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    _require_session(session_id, current_user["id"])

    temp_dir = "data/static"
    os.makedirs(temp_dir, exist_ok=True)
    unique_id = uuid.uuid4().hex[:12]
    temp_path = os.path.join(temp_dir, f"conv_{unique_id}.webm")

    if file:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    else:
        body = await request.body()
        if not body:
            raise HTTPException(status_code=400, detail="No audio received.")
        with open(temp_path, "wb") as f:
            f.write(body)

    transcript = ""
    try:
        from services.audio_ingester import GeminiTranscriptionProvider, MockProvider

        provider = (
            GeminiTranscriptionProvider()
            if os.getenv("GOOGLE_API_KEY")
            else MockProvider()
        )
        result = provider.transcribe(temp_path)
        transcript = result.text or ""
    except Exception:
        transcript = ""
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass

    if not transcript.strip():
        transcript = "Hello"

    try:
        conv_history = json.loads(history)
    except Exception:
        conv_history = []

    from ai.generation import generate_conversation_response

    res = generate_conversation_response(
        session_id, transcript, language=language, history=conv_history
    )
    answer = res["answer"]

    lang = language.lower()
    aethex_key = os.getenv("AETHEX_API_KEY", "")
    if aethex_key and lang in _AETHEX_TTS_LANGS:
        try:
            from services.aethex_tts import synthesize as _aethex

            effective_voice = voice_id or os.getenv("AETHEX_VOICE_ID") or None
            audio_bytes = _aethex(answer, voice_id=effective_voice, language=lang)
        except Exception:
            audio_bytes = _gemini_tts(answer)
    else:
        audio_bytes = synthesize_speech(answer, language=language)

    out_filename = f"conv_{unique_id}.wav"
    out_path = os.path.join(temp_dir, out_filename)
    with open(out_path, "wb") as f:
        f.write(audio_bytes)

    return {
        "transcript": transcript,
        "answer": answer,
        "audio_url": f"/static/{out_filename}",
        "language": language,
    }
