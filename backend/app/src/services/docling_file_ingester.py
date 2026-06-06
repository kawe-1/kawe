from __future__ import annotations

from abc import ABC
from pathlib import Path
from typing import TYPE_CHECKING, Any, Sequence

from .base_ingester import BaseIngester
from langchain_core.documents import Document

if TYPE_CHECKING:
    from docling.datamodel.base_models import InputFormat


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
    """Base ingester for file formats that should use Docling."""

    source_type: str
    supported_extensions: set[str]

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        path = Path(source)
        suffix = path.suffix.lower()
        if suffix not in self.supported_extensions:
            raise ValueError(
                f"{self.__class__.__name__} only accepts files with extensions: "
                f"{sorted(self.supported_extensions)}."
            )

        docling_document = self._convert_to_docling_document(path, **kwargs)
        markdown = self._serialize_docling_document(docling_document, **kwargs)
        return [
            Document(
                page_content=markdown,
                metadata={
                    "source_type": self.source_type,
                    "extension": suffix,
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

    def _convert_to_docling_document(self, path: Path, **kwargs: Any) -> Any:
        images_scale = kwargs.pop("images_scale", 2.0)
        converter = get_shared_converter(images_scale=images_scale)
        conv_res = converter.convert(path)
        return conv_res.document

    def _serialize_docling_document(
        self,
        docling_document: Any,
        **kwargs: Any,
    ) -> str:
        ImageRefMode, *_ = self._import_docling_components()
        image_mode = kwargs.pop("image_mode", ImageRefMode.EMBEDDED)

        import os
        import tempfile

        with tempfile.NamedTemporaryFile(
            suffix=".md",
            delete=False,
            mode="w+",
            encoding="utf-8",
        ) as temp_file:
            temp_path = temp_file.name

        try:
            try:
                result = docling_document.save_as_markdown(
                    temp_path,
                    image_mode=image_mode,
                )
            except TypeError:
                result = docling_document.save_as_markdown(image_mode=image_mode)

            if isinstance(result, str):
                return result

            with open(temp_path, "r", encoding="utf-8") as reader:
                return reader.read()
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass

    def _chunk_docling_document(
        self,
        docling_document: Any,
        source: str,
        base_metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> list[Document]:
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
