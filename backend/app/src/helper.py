import logging
from typing import Optional

from ai.generation import get_session_vector_store
from ai.settings import get_embeddings
from db import update_job, update_source_status
from services.youtube_ingester import YouTubeIngester
from services.web_ingester import WebIngester

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
    update_job(job_id, "processing")
    update_source_status(source_id, "processing")
    try:
        from services.registry import IngesterRegistry  # <-- Import your new registry

        embeddings = get_embeddings()
        vector_store = get_session_vector_store(session_id)

        extra_metadata = {
            "session_id": session_id,
            "source_id": source_id,
            "source_type": source_type,
            "source_name": name,
        }

        # Handle bytes-based ingestion dynamically
        if file_bytes is not None:
            # 1. Fetch the correct concrete class dynamically from the registry
            IngesterClass = IngesterRegistry.get_ingester_class(name)
            ingester = IngesterClass()

            # 2. Extract texts/documents using bytes
            docs = ingester.load(file_bytes, filename=name)

            # 3. Handle chunking and vector storage
            chunked_docs = ingester.chunk_documents(docs, source=source_id)
            ingester.persist_documents(
                chunked_docs,
                embeddings=embeddings,
                vector_store=vector_store,
                extra_metadata=extra_metadata,
            )

        # Handle URL-based ingestion (youtube, web) remains unchanged
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

        update_source_status(source_id, "completed")
        update_job(job_id, "completed", result={"source_id": source_id})
    except Exception as e:
        _log.exception(f"Ingestion failed for source {source_id}")
        update_source_status(source_id, "failed")
        update_job(job_id, "failed", error=str(e))
