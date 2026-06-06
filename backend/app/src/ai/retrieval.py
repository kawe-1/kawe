from __future__ import annotations

import re
from typing import Any, Sequence

from langchain_core.documents import Document


def retrieve_relevant_chunks(
    vector_store: Any,
    query_embedding: Sequence[float],
    query_text: str | None = None,
    source_id: str | None = None,
    source_name: str | None = None,
    top_k: int = 10,
    keyword_weight: float = 0.3,
    metadata_filter: dict[str, Any] | None = None,
) -> list[Document]:
    """Retrieve and rank relevant document chunks for RAG.

    The function uses vector similarity as the primary signal and applies
    lightweight keyword re-ranking when query text is available.
    """
    if top_k < 1:
        raise ValueError("top_k must be at least 1")

    combined_filter = _build_metadata_filter(source_id, source_name, metadata_filter)
    candidates = _search_vector_store(
        vector_store,
        query_embedding,
        k=max(top_k * 3, top_k),
        metadata_filter=combined_filter,
    )

    if not query_text or keyword_weight <= 0 or len(candidates) <= top_k:
        return candidates[:top_k]

    ranked = _rank_candidates(candidates, query_text, keyword_weight)
    return [document for document, _score in ranked[:top_k]]


def _build_metadata_filter(
    source_id: str | None,
    source_name: str | None,
    metadata_filter: dict[str, Any] | None,
) -> dict[str, Any] | None:
    filter_data: dict[str, Any] = (
        {} if metadata_filter is None else dict(metadata_filter)
    )

    if source_id:
        filter_data["source_id"] = source_id
    if source_name:
        filter_data["source_name"] = source_name

    return filter_data or None


def _search_vector_store(
    vector_store: Any,
    query_embedding: Sequence[float],
    k: int,
    metadata_filter: dict[str, Any] | None,
) -> list[Document]:
    if hasattr(vector_store, "similarity_search_by_vector"):
        results = vector_store.similarity_search_by_vector(
            query_embedding,
            k=k,
            filter=metadata_filter,
        )
    elif hasattr(vector_store, "similarity_search_with_score"):
        results = vector_store.similarity_search_with_score(
            query_embedding,
            k=k,
            filter=metadata_filter,
        )
    elif hasattr(vector_store, "similarity_search"):
        results = vector_store.similarity_search(
            query_embedding,
            k=k,
            filter=metadata_filter,
        )
    else:
        raise NotImplementedError(
            "The provided vector store does not support similarity search by vector."
        )

    return _normalize_search_results(results)


def _normalize_search_results(results: Any) -> list[Document]:
    if not results:
        return []

    if isinstance(results, list) and len(results) > 0:
        first = results[0]
        if (
            isinstance(first, tuple)
            and len(first) >= 2
            and isinstance(first[0], Document)
        ):
            documents: list[Document] = []
            for document, score in results:
                metadata = dict(document.metadata or {})
                metadata["__similarity_score__"] = score
                documents.append(
                    Document(page_content=document.page_content, metadata=metadata)
                )
            return documents

    if isinstance(results, list) and all(
        isinstance(item, Document) for item in results
    ):
        return list(results)

    raise TypeError("Unexpected vector store search result format.")


def _rank_candidates(
    candidates: list[Document],
    query_text: str,
    keyword_weight: float,
) -> list[tuple[Document, float]]:
    query_tokens = set(re.findall(r"\w+", query_text.lower()))
    if not query_tokens:
        return [(document, 1.0) for document in candidates]

    ranked: list[tuple[Document, float]] = []
    for document in candidates:
        source_score = _extract_similarity_score(document)
        keyword_score = _compute_keyword_score(document, query_tokens)
        combined_score = (source_score * (1.0 - keyword_weight)) + (
            keyword_score * keyword_weight
        )
        ranked.append((document, combined_score))

    return sorted(ranked, key=lambda item: item[1], reverse=True)


def _extract_similarity_score(document: Document) -> float:
    metadata = document.metadata or {}
    score = metadata.get("__similarity_score__")
    if score is None:
        score = metadata.get("score")
    if isinstance(score, (int, float)):
        return float(score)
    return 1.0


def _compute_keyword_score(document: Document, query_tokens: set[str]) -> float:
    text = " ".join(
        [document.page_content or ""]
        + [
            str(value)
            for value in (document.metadata or {}).values()
            if value is not None
        ]
    ).lower()
    if not text:
        return 0.0

    matches = sum(1 for token in query_tokens if token in text)
    return matches / len(query_tokens)
