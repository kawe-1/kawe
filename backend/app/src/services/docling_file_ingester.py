from __future__ import annotations

import io
from abc import ABC
from typing import TYPE_CHECKING, Any, Sequence

from langchain_core.documents import Document

from .base_ingester import BaseIngester

if TYPE_CHECKING:
    pass


_CONVERTER_CACHE = None
_CHUNKER_CACHE = None


def get_shared_converter(images_scale=2.0):
    global _CONVERTER_CACHE
    if _CONVERTER_CACHE is None:
        (
            ImageRefMode,
            InputFormat,
            PdfPipelineOptions,
            DocumentConverter,
            PdfFormatOption,
        ) = DoclingFileIngester._import_docling_components()

        pipeline_options = PdfPipelineOptions()
        pipeline_options.images_scale = images_scale
        pipeline_options.generate_page_images = True
        pipeline_options.generate_picture_images = True

        format_options = {
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
        _CONVERTER_CACHE = DocumentConverter(format_options=format_options)
    return _CONVERTER_CACHE


def get_shared_chunker():
    global _CHUNKER_CACHE
    if _CHUNKER_CACHE is None:
        HybridChunker = DoclingFileIngester._import_docling_chunker()
        _CHUNKER_CACHE = HybridChunker()
    return _CHUNKER_CACHE


class DoclingFileIngester(BaseIngester, ABC):
    """Base ingester for binary file data that processes entirely in memory using Docling."""

    source_type: str
    supported_extensions: set[str]

    def load(
        self, file_bytes: bytes, filename: str, **kwargs: Any
    ) -> Sequence[Document]:
        """
        Accepts raw file bytes and the original filename (for extension routing).
        Completely bypasses any local file path creation.
        """
        # Extract and validate extension
        suffix = f".{filename.split('.')[-1].lower()}" if "." in filename else ""
        if suffix not in self.supported_extensions:
            raise ValueError(
                f"{self.__class__.__name__} only accepts files with extensions: "
                f"{sorted(self.supported_extensions)}."
            )

        # 1. Convert entirely in memory
        docling_document = self._convert_bytes_to_docling(
            file_bytes, filename, **kwargs
        )

        # 2. Serialize to markdown string entirely in memory
        markdown = self._serialize_docling_document(docling_document, **kwargs)

        return [
            Document(
                page_content=markdown,
                metadata={
                    "source_type": self.source_type,
                    "extension": suffix,
                    "filename": filename,
                    "_docling_document": docling_document,
                },
            )
        ]

    def chunk_documents(
        self,
        documents: Sequence[Document],
        source: str,
        **kwargs: Any,
    ) -> list[Document]:
        if documents and documents[0].metadata:
            docling_document = documents[0].metadata.get("_docling_document")
            if docling_document is not None:
                base_metadata = dict(documents[0].metadata or {})
                base_metadata.pop("_docling_document", None)
                return self._chunk_docling_document(
                    docling_document,
                    source,
                    base_metadata=base_metadata,
                    **kwargs,
                )

        return super().chunk_documents(documents, source=source, **kwargs)

    def _convert_bytes_to_docling(
        self, file_bytes: bytes, filename: str, **kwargs: Any
    ) -> Any:
        """Wraps binary data into an in-memory stream for Docling."""
        from docling.datamodel.base_models import DocumentStream

        images_scale = kwargs.pop("images_scale", 2.0)
        converter = get_shared_converter(images_scale=images_scale)

        # Wrap bytes into an in-memory byte stream
        bytes_stream = io.BytesIO(file_bytes)

        # Docling needs the filename string to determine file formatting pipeline
        doc_stream = DocumentStream(name=filename, stream=bytes_stream)

        conv_res = converter.convert(doc_stream)
        return conv_res.document

    def _serialize_docling_document(
        self,
        docling_document: Any,
        **kwargs: Any,
    ) -> str:
        """Exports the document structure to a Markdown string directly in memory."""
        ImageRefMode, *_ = self._import_docling_components()
        image_mode = kwargs.pop("image_mode", ImageRefMode.EMBEDDED)

        # No temporary files needed! export_to_markdown handles strings natively.
        return docling_document.export_to_markdown(image_mode=image_mode)

    def _chunk_docling_document(
        self,
        docling_document: Any,
        source: str,
        base_metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> list[Document]:
        # ... Keep your existing chunking parsing implementation identical ...
        chunker_options = kwargs.pop("docling_chunker_options", {})
        if not chunker_options:
            chunker = get_shared_chunker()
        else:
            HybridChunker = self._import_docling_chunker()
            chunker = HybridChunker(**chunker_options)

        chunks: list[Document] = []
        base_metadata = dict(base_metadata or {})

        for chunk_index, chunk in enumerate(chunker.chunk(docling_document), start=1):
            if hasattr(chunker, "contextualize"):
                page_content = chunker.contextualize(chunk)
            else:
                page_content = getattr(chunk, "text", str(chunk))

            metadata: dict[str, Any] = dict(getattr(chunk, "metadata", {}) or {})
            metadata.update(base_metadata)
            metadata.setdefault("source_type", self.source_type)
            metadata.setdefault("source", source)
            metadata["chunk_index"] = chunk_index
            metadata["parent_document_id"] = f"{source}:doc"
            chunks.append(Document(page_content=page_content, metadata=metadata))

        return chunks

    @staticmethod
    def _import_docling_components():
        try:
            from docling.datamodel.base_models import InputFormat
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            from docling.document_converter import DocumentConverter, PdfFormatOption
            from docling_core.types.doc import ImageRefMode
        except ImportError as exc:
            raise ImportError(
                "Docling is required to ingest PDF, DOCX, PPTX, and HTML files. "
                "Install docling and its extras before using file-based ingesters."
            ) from exc

        return (
            ImageRefMode,
            InputFormat,
            PdfPipelineOptions,
            DocumentConverter,
            PdfFormatOption,
        )

    @staticmethod
    def _import_docling_chunker():
        try:
            from docling.chunking import HybridChunker
        except ImportError:
            try:
                from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
            except ImportError as exc:
                raise ImportError(
                    "Docling chunking support is required for file-based chunking. "
                    "Install docling[chunking] or docling-core[chunking] extras."
                ) from exc

        return HybridChunker
