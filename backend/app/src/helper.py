import logging
from typing import Optional

from ai.generation import get_session_vector_store
from ai.settings import get_embeddings
from db.database import SessionLocal
from db.repositories import JobRepository, SourceRepository
from services.web_ingester import WebIngester
from services.youtube_ingester import YouTubeIngester

_log = logging.getLogger(__name__)


def background_ingest_source(
    job_id: str,
    source_id: str,
    session_id: str,
    source_type: str,
    path_or_url: str,
    name: str,
    file_bytes: Optional[bytes] = None,
    **kwargs,
):
    with SessionLocal() as db:
        job_repo = JobRepository(db=db)
        source_repo = SourceRepository(db=db)
        job_repo.update_job(job_id, "processing")
        source_repo.update_source_status(source_id, "processing")
        try:
            from services.registry import IngesterRegistry

            embeddings = get_embeddings()
            vector_store = get_session_vector_store(session_id)

            extra_metadata = {
                "session_id": session_id,
                "source_id": source_id,
                "source_type": source_type,
                "source_name": name,
            }

            if file_bytes is not None:
                IngesterClass = IngesterRegistry.get_ingester_class(name)
                ingester = IngesterClass()
                docs = ingester.load(file_bytes, filename=name)
                chunked_docs = ingester.chunk_documents(docs, source=source_id)
                ingester.persist_documents(
                    chunked_docs,
                    embeddings=embeddings,
                    vector_store=vector_store,
                    extra_metadata=extra_metadata,
                )
            else:
                if source_type == "youtube":
                    ingester = YouTubeIngester()
                elif source_type == "web":
                    ingester = WebIngester()
                else:
                    raise ValueError(f"Unknown URL-based source type: {source_type}")

                ingester.ingest(
                    path_or_url,
                    embeddings=embeddings,
                    vector_store=vector_store,
                    extra_metadata=extra_metadata,
                    **kwargs,
                )

            source_repo.update_source_status(source_id, "completed")
            job_repo.update_job(job_id, "completed", result={"source_id": source_id})
        except Exception as e:
            _log.exception(f"Ingestion failed for source {source_id}")
            source_repo.update_source_status(source_id, "failed")
            job_repo.update_job(job_id, "failed", error=str(e))
