import sys
from pathlib import Path

import pytest

try:
    from langchain.schema import Document
except ImportError:
    from langchain_core.documents import Document

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from services.base_ingester import BaseIngester
from services.pdf_ingester import PdfIngester
from services.registry import IngesterRegistry
from services.web_ingester import WebIngester
from services.youtube_ingester import YouTubeIngester


class DummyIngester(BaseIngester):
    def load(self, source: str, **kwargs):
        return [Document(page_content="hello", metadata={"example": True})]

    def supported_formats(self):
        return ["dummy"]


def test_base_ingester_attaches_metadata():
    ingester = DummyIngester()
    documents = ingester.ingest("test-source.txt", extra_metadata={"user": "tester"})

    assert len(documents) == 1
    assert documents[0].page_content == "hello"
    assert documents[0].metadata["source"] == "test-source.txt"
    assert documents[0].metadata["user"] == "tester"


def test_base_ingester_chunks_documents():
    class ChunkingDummyIngester(DummyIngester):
        def load(self, source: str, **kwargs):
            return [
                Document(page_content="a" * 2500, metadata={"source_type": "dummy"})
            ]

        def supported_formats(self):
            return ["dummy"]

    ingester = ChunkingDummyIngester()
    documents = ingester.ingest("test-source.txt", chunk_size=1000, chunk_overlap=100)

    assert len(documents) == 3
    assert documents[0].metadata["source"] == "test-source.txt"
    assert documents[0].metadata["chunk_index"] == 1
    assert documents[0].metadata["document_index"] == 1


def test_web_ingester_rejects_invalid_url():
    ingester = WebIngester()

    with pytest.raises(ValueError, match="http:// or https://"):
        ingester.ingest("ftp://example.com")


def test_youtube_extract_video_id():
    ingester = YouTubeIngester()

    assert ingester._extract_video_id("https://youtu.be/abc123") == "abc123"
    assert (
        ingester._extract_video_id("https://www.youtube.com/watch?v=abc123&list=xyz")
        == "abc123"
    )


def test_registry_returns_pdf_ingester_for_pdf_path():
    ingester = IngesterRegistry.get_ingester_for_source("/tmp/example.pdf")

    assert ingester.__class__.__name__ == "PdfIngester"


def test_registry_returns_docx_ingester_for_docx_path():
    ingester = IngesterRegistry.get_ingester_for_source("/tmp/example.docx")

    assert ingester.__class__.__name__ == "DocxIngester"


def test_registry_returns_html_ingester_for_html_path():
    ingester = IngesterRegistry.get_ingester_for_source("/tmp/example.html")

    assert ingester.__class__.__name__ == "HtmlIngester"


def test_registry_returns_pptx_ingester_for_pptx_path():
    ingester = IngesterRegistry.get_ingester_for_source("/tmp/example.pptx")

    assert ingester.__class__.__name__ == "PptxIngester"


def test_docling_file_ingester_uses_conversion(monkeypatch, tmp_path):
    ingester = PdfIngester()
    file_path = tmp_path / "example.pdf"
    file_path.write_text("dummy pdf content")

    monkeypatch.setattr(
        PdfIngester,
        "_convert_to_docling_document",
        lambda self, path, **kwargs: object(),
    )
    monkeypatch.setattr(
        PdfIngester,
        "_serialize_docling_document",
        lambda self, docling_document, **kwargs: "converted pdf",
    )
    monkeypatch.setattr(
        PdfIngester,
        "chunk_documents",
        lambda self, documents, source, **kwargs: list(documents),
    )

    documents = ingester.ingest(str(file_path))

    assert len(documents) == 1
    assert documents[0].page_content == "converted pdf"
    assert documents[0].metadata["source_type"] == "pdf"


def test_registry_raises_for_unknown_source():
    with pytest.raises(ValueError, match="No registered ingester"):
        IngesterRegistry.get_ingester_for_source("unknown-source.xyz")


def test_serialize_docling_document_uses_filename_and_reads_back(monkeypatch):
    ingester = PdfIngester()

    class FakeImageRefMode:
        EMBEDDED = "embedded"

    monkeypatch.setattr(
        PdfIngester,
        "_import_docling_components",
        staticmethod(lambda: (FakeImageRefMode,)),
    )

    class FakeDoc:
        def save_as_markdown(self, filename, image_mode=None):
            with open(filename, "w", encoding="utf-8") as f:
                f.write("markdown content")

    result = ingester._serialize_docling_document(FakeDoc())
    assert result == "markdown content"


def test_serialize_docling_document_returns_string_directly(monkeypatch):
    ingester = PdfIngester()

    class FakeImageRefMode:
        EMBEDDED = "embedded"

    monkeypatch.setattr(
        PdfIngester,
        "_import_docling_components",
        staticmethod(lambda: (FakeImageRefMode,)),
    )

    class FakeDoc:
        def save_as_markdown(self, *args, **kwargs):
            return "direct markdown"

    result = ingester._serialize_docling_document(FakeDoc())
    assert result == "direct markdown"


def test_base_ingester_persist_documents_with_explicit_store():
    ingester = DummyIngester()
    documents = [Document(page_content="hello", metadata={"example": True})]

    class FakeStore:
        def __init__(self):
            self.documents = []

        def add_documents(self, docs):
            self.documents.extend(docs)

    fake_store = FakeStore()
    persisted = ingester.persist_documents(documents, vector_store=fake_store)

    assert persisted == documents
    assert fake_store.documents == documents


def test_get_vector_store_raises_for_unknown_provider(monkeypatch):
    from services.vector_store_factory import get_vector_store

    monkeypatch.setenv("VECTOR_DB_PROVIDER", "unsupported")

    with pytest.raises(ValueError, match="Unsupported VECTOR_DB_PROVIDER"):
        get_vector_store(embedding_function=object())
