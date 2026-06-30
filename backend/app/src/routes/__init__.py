from fastapi import APIRouter

from helper import background_ingest_source

from .artifacts import router as artifacts_router
from .auth import router as auth_router
from .chat import router as chat_router
from .groups import router as group_router
from .jobs import router as jobs_router
from .sessions import router as sessions_router
from .sources import router as sources_router
from .voice import router as voice_router
from .voice import synthesize_speech

router = APIRouter()
router.include_router(auth_router)
router.include_router(sessions_router)
router.include_router(sources_router)
router.include_router(artifacts_router)
router.include_router(chat_router)
router.include_router(voice_router)
router.include_router(jobs_router)
router.include_router(group_router)

# Expose compatibility names used by tests and legacy imports.
generate_speech = synthesize_speech

__all__ = [
    "router",
    "background_ingest_source",
    "synthesize_speech",
    "generate_speech",
]
