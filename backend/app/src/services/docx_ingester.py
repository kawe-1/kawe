from __future__ import annotations

from typing import Sequence

from .docling_file_ingester import DoclingFileIngester


class DocxIngester(DoclingFileIngester):
    """Ingest DOCX documents using Docling."""

    source_type = "docx"
    supported_extensions = {".docx"}

    def supported_formats(self) -> Sequence[str]:
        return ["docx"]


if __name__ == "__main__":
    """Manual test for DocxIngester.

    Update `sample_docx` to point to a real DOCX file and run the script
    from the repository root using `python -m src.services.docx_ingester`.
    """
    from pathlib import Path

    sample_docx = Path("For Stitch.docx")
    if not sample_docx.exists():
        print(
            f"DocxIngester sample file not found: {sample_docx}\n"
            "Please replace `sample_docx` with a real file path before running."
        )
    else:
        ing = DocxIngester()
        try:
            docs = ing.ingest(str(sample_docx))
            print(f"Loaded and chunked {len(docs)} document(s).")
            if docs:
                print(docs[0].page_content[:400])
        except Exception as exc:  # pragma: no cover - example-only
            print("DocxIngester example failed:", type(exc).__name__, exc)
            print(
                "If this error mentions Docling, install docling and its extras per README."
            )
