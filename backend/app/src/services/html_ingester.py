from __future__ import annotations

from typing import Sequence

from .docling_file_ingester import DoclingFileIngester


class HtmlIngester(DoclingFileIngester):
    """Ingest HTML documents using Docling."""

    source_type = "html"
    supported_extensions = {".html", ".htm"}

    def supported_formats(self) -> Sequence[str]:
        return ["html", "htm"]


if __name__ == "__main__":
    """Manual test for HtmlIngester using a temporary .html file.

    Real HTML conversion will use Docling to keep images and tables.
    This example falls back gracefully if Docling is not available.
    """
    import tempfile
    from pathlib import Path

    print("HtmlIngester example: creating a temporary .html file and converting it")
    tmp = Path(tempfile.gettempdir()) / "example.html"
    tmp.write_text("<html><body><h1>Title</h1><p>Paragraph</p></body></html>")

    ing = HtmlIngester()
    try:
        docs = ing.ingest(str(tmp))
        print(f"Loaded and chunked {len(docs)} document(s).")
        if docs:
            print(docs[0].page_content[:400])
    except Exception as exc:  # pragma: no cover - example-only
        print("HtmlIngester example failed:", type(exc).__name__, exc)
        print(
            "If this error mentions Docling, install docling and its extras per README."
        )
