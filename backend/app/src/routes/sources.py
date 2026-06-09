import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from auth import get_current_user
from db import (
    create_job,
    create_source,
    delete_source,
    get_source,
    list_sources,
)
from helper import background_ingest_source
from services.registry import IngesterRegistry

from .common import MAX_FILE_SIZE, _require_session

router = APIRouter()


class YoutubeRequest(BaseModel):
    url: str


class WebUrlRequest(BaseModel):
    url: str


@router.post("/api/sessions/{session_id}/sources/document")
async def upload_document(
    session_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    session = _require_session(session_id, current_user["id"])
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IngesterRegistry.EXTENSION_MAP:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Supported: PDF, DOCX, PPTX, HTML.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    bytes_uri = f"bytes://{source_id}"
    create_source(
        source_id, session_id, file.filename, "document", bytes_uri, "pending"
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
    session_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    session = _require_session(session_id, current_user["id"])
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IngesterRegistry.EXTENSION_MAP:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Supported: MP3, WAV, M4A, WebM, OGG, FLAC.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    bytes_uri = f"bytes://{source_id}"
    create_source(source_id, session_id, file.filename, "audio", bytes_uri, "pending")
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
    session_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    session = _require_session(session_id, current_user["id"])
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IngesterRegistry.EXTENSION_MAP:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Supported: PNG, JPG, JPEG, WEBP.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    bytes_uri = f"bytes://{source_id}"
    create_source(source_id, session_id, file.filename, "image", bytes_uri, "pending")
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


@router.post("/api/sessions/{session_id}/sources/youtube")
def upload_youtube(
    session_id: str,
    req: YoutubeRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    session = _require_session(session_id, current_user["id"])

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


@router.post("/api/sessions/{session_id}/sources/web")
def upload_web(
    session_id: str,
    req: WebUrlRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    session = _require_session(session_id, current_user["id"])
    if not req.url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400, detail="URL must start with http:// or https://"
        )

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    create_source(source_id, session_id, req.url, "web", req.url, "pending")
    create_job(job_id, "processing")

    background_tasks.add_task(
        background_ingest_source,
        job_id=job_id,
        source_id=source_id,
        session_id=session_id,
        source_type="web",
        path_or_url=req.url,
        name=req.url,
    )

    return {"job_id": job_id, "source_id": source_id}


@router.get("/api/sessions/{session_id}/sources")
def api_list_sources(session_id: str, current_user: dict = Depends(get_current_user)):
    _require_session(session_id, current_user["id"])
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
            matching_docs = vs.similarity_search(
                query="",  # empty string or wildcards depending on implementation
                k=10000,  # search ceiling to catch all chunks of this source
                filter={"source_id": source_id},
            )

            doc_ids = [doc.id for doc in matching_docs if doc.id is not None]

            if hasattr(vs, "_collection") and not doc_ids:
                # Native Chroma fallback
                vs._collection.delete(where={"source_id": source_id})
            elif doc_ids:
                # Unified LangChain standard approach
                vs.delete(ids=doc_ids)

    except Exception as e:
        import logging

        logging.getLogger(__name__).error(
            f"Failed to clear source from vector store: {e}"
        )
        pass

    return {"message": "Source deleted"}
