from __future__ import annotations

import os
from typing import Any

from langchain.embeddings.base import Embeddings


def get_vector_store(
    embedding_function: Embeddings,
    provider: str | None = None,
    **kwargs: Any,
):
    """Return a LangChain vector store instance for the selected provider."""
    provider = (
        provider or os.getenv("VECTOR_DB_PROVIDER", "")
    ).strip().lower() or "chroma"

    if provider == "chroma":
        try:
            from langchain.vectorstores import Chroma
        except ImportError as exc:
            raise ImportError(
                "Chroma vector store support is required but not installed. "
                "Install chromadb and langchain-vectorstores."
            ) from exc

        return Chroma(embedding_function=embedding_function, **kwargs)

    if provider == "qdrant":
        try:
            from langchain.vectorstores import Qdrant
        except ImportError as exc:
            raise ImportError(
                "Qdrant vector store support is required but not installed. "
                "Install qdrant-client and langchain-vectorstores."
            ) from exc

        return Qdrant(embedding_function=embedding_function, **kwargs)

    if provider == "weaviate":
        try:
            from langchain.vectorstores import Weaviate
        except ImportError as exc:
            raise ImportError(
                "Weaviate vector store support is required but not installed. "
                "Install weaviate-client and langchain-vectorstores."
            ) from exc

        return Weaviate(embedding_function=embedding_function, **kwargs)

    if provider == "milvus":
        try:
            from langchain.vectorstores import Milvus
        except ImportError as exc:
            raise ImportError(
                "Milvus vector store support is required but not installed. "
                "Install pymilvus and langchain-vectorstores."
            ) from exc

        return Milvus(embedding_function=embedding_function, **kwargs)

    raise ValueError(
        f"Unsupported VECTOR_DB_PROVIDER '{provider}'. "
        "Supported providers are: chroma, qdrant, weaviate, milvus."
    )
