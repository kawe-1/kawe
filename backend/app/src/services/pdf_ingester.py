from __future__ import annotations

from typing import Sequence

from .docling_file_ingester import DoclingFileIngester


class PdfIngester(DoclingFileIngester):
    """Ingest PDF documents using Docling."""

    source_type = "pdf"
    supported_extensions = {".pdf"}

    def supported_formats(self) -> Sequence[str]:
        return ["pdf"]


if __name__ == "__main__":
    """Manual test for PdfIngester using a temporary file.

    Notes:
    - Docling must be installed for a real conversion. If Docling is
      missing this example will print a helpful message.
    """
    import tempfile
    from pathlib import Path

    print("PdfIngester example: creating a temporary .pdf file and converting it")
    tmp = Path(tempfile.gettempdir()) / "example.pdf"
    tmp.write_text("dummy pdf content")

    ing = PdfIngester()
    try:
        docs = ing.ingest(str(tmp))
        print(f"Loaded and chunked {len(docs)} document(s).")
        if docs:
            for doc in docs:
                print(doc.page_content[:800])
    except Exception as exc:  # pragma: no cover - example-only
        print("PdfIngester example failed:", type(exc).__name__, exc)
        print(
            "If this error mentions Docling, install docling and its extras per README."
        )
