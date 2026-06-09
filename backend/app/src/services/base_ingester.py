from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Sequence, Union

try:
    from langchain.schema import Document
except ImportError:
    from langchain_core.documents import Document


class BaseIngester(ABC):
    """Base template for document ingestion services."""

    def ingest(
        self,
        source: Union[str, Path],
        *,
        extra_metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> list[Document]:
        """Ingest the source and return normalized LangChain documents."""
        source_value = str(source)
        self._validate_source(source_value)

        chunk_kwargs = self._extract_chunk_kwargs(kwargs)
        documents = self.load(source_value, **kwargs)

        metadata = extra_metadata or {}
        documents = [
            self._attach_metadata(document, source_value, metadata)
            for document in documents
        ]

        chunked_documents = self.chunk_documents(
            documents, source=source_value, **chunk_kwargs
        )
        return self.persist_documents(chunked_documents, **kwargs)

    @abstractmethod
    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        """Load and return LangChain documents from the given source."""

    @abstractmethod
    def supported_formats(self) -> Sequence[str]:
        """Return the supported source formats for this ingester."""

    def get_text_splitter(self, **kwargs: Any):
        try:
            from langchain.text_splitters import RecursiveCharacterTextSplitter
        except ImportError:
            try:
                from langchain_text_splitters import RecursiveCharacterTextSplitter
            except ImportError as exc:
                raise ImportError(
                    "A text splitter package is required for document chunking. "
                    "Install langchain-text-splitters or the appropriate LangChain package."
                ) from exc

        chunk_size = kwargs.pop("chunk_size", 1000)
        chunk_overlap = kwargs.pop("chunk_overlap", 200)
        return RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    def chunk_documents(
        self,
        documents: Sequence[Document],
        source: str,
        **kwargs: Any,
    ) -> list[Document]:
        """Split documents into smaller chunks using a text splitter."""
        splitter = self.get_text_splitter(**kwargs)
        chunks: list[Document] = []

        for document_index, document in enumerate(documents, start=1):
            split_documents = splitter.split_documents([document])
            for chunk_index, chunk in enumerate(split_documents, start=1):
                metadata: Dict[str, Any] = dict(chunk.metadata or {})
                metadata.setdefault("source", source)
                metadata.setdefault("parent_document_id", f"{source}:{document_index}")
                metadata["document_index"] = document_index
                metadata["chunk_index"] = chunk_index
                chunks.append(
                    Document(page_content=chunk.page_content, metadata=metadata)
                )

        return chunks

    def persist_documents(
        self,
        documents: Sequence[Document],
        embeddings: Any | None = None,
        vector_store: Any | None = None,
        **kwargs: Any,
    ) -> list[Document]:
        """Persist chunked documents using a unified vector store."""
        if vector_store is None or embeddings is None or not documents:
            return list(documents)

        vector_store.add_documents(list(documents))

        return list(documents)

    def _extract_chunk_kwargs(self, kwargs: dict[str, Any]) -> dict[str, Any]:
        return {
            "chunk_size": kwargs.pop("chunk_size", 1000),
            "chunk_overlap": kwargs.pop("chunk_overlap", 200),
        }

    def _validate_source(self, source: str) -> None:
        if not source:
            raise ValueError("Source must be a non-empty string.")

    def _attach_metadata(
        self,
        document: Document,
        source: str,
        extra_metadata: dict[str, Any],
    ) -> Document:
        metadata: Dict[str, Any] = dict(document.metadata or {})
        metadata.setdefault("source", source)
        metadata.update(extra_metadata)
        return Document(page_content=document.page_content, metadata=metadata)
