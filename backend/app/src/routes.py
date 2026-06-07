import logging
import os
import shutil
import uuid
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from pydantic import BaseModel

from db import (
    add_chat_message,
    create_job,
    create_session,
    create_source,
    delete_session,
    delete_source,
    get_artifact,
    get_chat_history,
    get_job,
    get_session,
    get_source,
    list_sessions,
    list_sources,
    save_artifact,
)
from helper import background_ingest_source
from services.registry import IngesterRegistry

_log = logging.getLogger(__name__)

router = APIRouter()

# File upload limits
MAX_FILE_SIZE = 20_971_520  # 20 MB in bytes (20 * 1024 * 1024)


# ----------------------------------------------------
# Session Management Endpoints
# ----------------------------------------------------
class CreateSessionRequest(BaseModel):
    title: str


@router.post("/api/sessions")
def api_create_session(req: CreateSessionRequest):
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    create_session(session_id, req.title)
    return {"id": session_id, "title": req.title}


@router.get("/api/sessions")
def api_list_sessions():
    return list_sessions()


@router.get("/api/sessions/{session_id}")
def api_get_session(session_id: str):
    session = get_session(session_id)
    if not session:
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
def api_delete_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    delete_session(session_id)

    # Clean up uploaded files and vector store
    for folder in [f"data/uploads/{session_id}", f"data/vector_stores/{session_id}"]:
        if os.path.exists(folder):
            try:
                shutil.rmtree(folder)
            except OSError:
                pass

    return {"message": "Session deleted"}


# ----------------------------------------------------
# Source Ingestion Endpoints
# ----------------------------------------------------
@router.post("/api/sessions/{session_id}/sources/document")
async def upload_document(
    session_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IngesterRegistry.EXTENSION_MAP:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Supported: PDF, DOCX, PPTX, HTML.",
        )

    # Read file as bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    # Store metadata without file path (bytes handled in memory)
    create_source(
        source_id,
        session_id,
        file.filename,
        "document",
        f"bytes://{source_id}",
        "pending",
    )
    create_job(job_id, "processing")

    background_tasks.add_task(
        background_ingest_source,
        job_id=job_id,
        source_id=source_id,
        session_id=session_id,
        source_type="document",
        path_or_url=f"bytes://{source_id}",
        name=file.filename,
        file_bytes=file_bytes,
    )

    return {"job_id": job_id, "source_id": source_id}


@router.post("/api/sessions/{session_id}/sources/audio")
async def upload_audio(
    session_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IngesterRegistry.EXTENSION_MAP:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Supported: MP3, WAV, M4A.",
        )

    # Read file as bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    # Store metadata without file path (bytes handled in memory)
    create_source(
        source_id, session_id, file.filename, "audio", f"bytes://{source_id}", "pending"
    )
    create_job(job_id, "processing")

    background_tasks.add_task(
        background_ingest_source,
        job_id=job_id,
        source_id=source_id,
        session_id=session_id,
        source_type="audio",
        path_or_url=f"bytes://{source_id}",
        name=file.filename,
        file_bytes=file_bytes,
    )

    return {"job_id": job_id, "source_id": source_id}


@router.post("/api/sessions/{session_id}/sources/image")
async def upload_image(
    session_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IngesterRegistry.EXTENSION_MAP:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Supported: PNG, JPG, JPEG, WEBP.",
        )

    # Read file as bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    # Store metadata without file path (bytes handled in memory)
    create_source(
        source_id, session_id, file.filename, "image", f"bytes://{source_id}", "pending"
    )
    create_job(job_id, "processing")

    background_tasks.add_task(
        background_ingest_source,
        job_id=job_id,
        source_id=source_id,
        session_id=session_id,
        source_type="image",
        path_or_url=f"bytes://{source_id}",
        name=file.filename,
        file_bytes=file_bytes,
    )

    return {"job_id": job_id, "source_id": source_id}


class YoutubeRequest(BaseModel):
    url: str


@router.post("/api/sessions/{session_id}/sources/youtube")
def upload_youtube(
    session_id: str, req: YoutubeRequest, background_tasks: BackgroundTasks
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    create_source(source_id, session_id, req.url, "youtube", req.url, "pending")
    create_job(job_id, "processing")

    background_tasks.add_task(
        background_ingest_source,
        job_id=job_id,
        source_id=source_id,
        session_id=session_id,
        source_type="youtube",
        path_or_url=req.url,
        name=req.url,
    )

    return {"job_id": job_id, "source_id": source_id}


@router.get("/api/sessions/{session_id}/sources")
def api_list_sources(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return list_sources(session_id)


@router.delete("/api/sources/{source_id}")
def api_delete_source(source_id: str):
    source = get_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    delete_source(source_id)

    try:
        from ai.generation import get_session_vector_store

        vs = get_session_vector_store(source["session_id"])
        if vs:
            vs.delete(where={"source_id": source_id})
    except Exception:
        pass

    return {"message": "Source deleted"}


# ----------------------------------------------------
# Artifact Generation Endpoints
# ----------------------------------------------------
@router.post("/api/sessions/{session_id}/notes")
def api_generate_notes(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from ai.generation import generate_notes

    try:
        notes = generate_notes(session_id, session["title"])
        save_artifact(session_id, "notes", notes)
        return notes
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/notes")
def api_get_notes(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    notes = get_artifact(session_id, "notes")
    if not notes:
        raise HTTPException(status_code=404, detail="Notes not generated yet")
    return notes


class QuizRequest(BaseModel):
    num_questions: int = 5
    difficulty: str = "medium"


@router.post("/api/sessions/{session_id}/quiz")
def api_generate_quiz(session_id: str, req: QuizRequest):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from ai.generation import generate_quiz

    try:
        quiz = generate_quiz(
            session_id, session["title"], req.num_questions, req.difficulty
        )
        save_artifact(session_id, "quiz", quiz)
        return quiz
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/quiz")
def api_get_quiz(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    quiz = get_artifact(session_id, "quiz")
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not generated yet")
    return quiz


@router.post("/api/sessions/{session_id}/flashcards")
def api_generate_flashcards(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from ai.generation import generate_flashcards

    try:
        deck = generate_flashcards(session_id, session["title"])
        save_artifact(session_id, "flashcards", deck)
        return deck
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/flashcards")
def api_get_flashcards(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    deck = get_artifact(session_id, "flashcards")
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcards not generated yet")
    return deck


@router.post("/api/sessions/{session_id}/concepts")
def api_generate_concepts(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from ai.generation import generate_concepts

    try:
        concepts = generate_concepts(session_id, session["title"])
        save_artifact(session_id, "concepts", concepts)
        return concepts
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/sessions/{session_id}/concepts")
def api_get_concepts(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    concepts = get_artifact(session_id, "concepts")
    if not concepts:
        raise HTTPException(status_code=404, detail="Concepts not generated yet")
    return concepts


# ----------------------------------------------------
# AI Tutor Chat Endpoints
# ----------------------------------------------------
class ChatRequest(BaseModel):
    message: str


@router.post("/api/sessions/{session_id}/chat")
def api_chat(session_id: str, req: ChatRequest):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Add user message to history
    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    add_chat_message(user_msg_id, session_id, "user", req.message)

    # Generate RAG response
    from ai.generation import generate_rag_response

    res = generate_rag_response(session_id, req.message)

    # Add assistant response to history
    asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    add_chat_message(asst_msg_id, session_id, "assistant", res["answer"])

    return res


@router.get("/api/sessions/{session_id}/chat")
def api_chat_history(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    history = get_chat_history(session_id)
    return [
        {"role": h["role"], "message": h["message"], "created_at": h["created_at"]}
        for h in history
    ]


# ----------------------------------------------------
# Voice Tutor Endpoint
# ----------------------------------------------------
def generate_speech(text: str) -> bytes:
    """Natively convert generated text response to audio bytes using Gemini."""
    import os

    from google import genai
    from google.genai import types

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return generate_dummy_wav()

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Read this educational response aloud exactly as written, with a clear and natural voice: {text}",
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

        audio_bytes = None
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                import base64

                data = part.inline_data.data
                if isinstance(data, str):
                    audio_bytes = base64.b64decode(data)
                else:
                    audio_bytes = data
                break
        return audio_bytes or generate_dummy_wav()
    except Exception:
        return generate_dummy_wav()


def generate_dummy_wav() -> bytes:
    """Fallback generator for empty audio response in test mode."""
    import struct

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
    session_id: str, request: Request, file: Optional[UploadFile] = File(None)
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    temp_dir = "data/static"
    os.makedirs(temp_dir, exist_ok=True)

    unique_id = uuid.uuid4().hex[:12]
    temp_audio_path = os.path.join(temp_dir, f"temp_{unique_id}.webm")

    # Read raw body if file upload is missing
    if file:
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    else:
        body = await request.body()
        if not body:
            raise HTTPException(status_code=400, detail="Empty audio payload")
        with open(temp_audio_path, "wb") as f:
            f.write(body)

    # Transcribe audio query
    try:
        from services.audio_ingester import GeminiTranscriptionProvider, MockProvider

        provider = (
            GeminiTranscriptionProvider()
            if os.getenv("GOOGLE_API_KEY")
            else MockProvider()
        )
        result = provider.transcribe(temp_audio_path)
        transcript = result.text
    except Exception as e:
        transcript = ""
        _log.warning(f"Voice query transcription failed: {e}")
    finally:
        # Delete input temp file
        if os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except OSError:
                pass

    if not transcript:
        # Fallback question
        transcript = "Hello"

    # Query RAG
    from ai.generation import generate_rag_response

    res = generate_rag_response(session_id, transcript)

    # Save conversation messages
    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    add_chat_message(user_msg_id, session_id, "user", transcript)
    add_chat_message(asst_msg_id, session_id, "assistant", res["answer"])

    # Generate speech
    audio_bytes = generate_speech(res["answer"])
    output_audio_filename = f"voice_{unique_id}.wav"
    output_audio_path = os.path.join(temp_dir, output_audio_filename)

    with open(output_audio_path, "wb") as f:
        f.write(audio_bytes)

    return {
        "transcript": transcript,
        "answer": res["answer"],
        "audio_url": f"/static/{output_audio_filename}",
    }


# ----------------------------------------------------
# Processing Status Endpoint
# ----------------------------------------------------
@router.get("/api/jobs/{job_id}")
def api_get_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
