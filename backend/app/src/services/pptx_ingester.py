from __future__ import annotations

from typing import Sequence

from .docling_file_ingester import DoclingFileIngester


class PptxIngester(DoclingFileIngester):
    """Ingest PPTX presentations using Docling."""

    source_type = "pptx"
    supported_extensions = {".pptx"}

    def supported_formats(self) -> Sequence[str]:
        return ["pptx"]


if __name__ == "__main__":
    """Manual test for PptxIngester.

    Update `sample_pptx` to point to a real PPTX file and run the script
    from the repository root using `python -m src.services.pptx_ingester`.
    """
    import sys
    from pathlib import Path

    sample_pptx = Path("sample.pptx")
    if not sample_pptx.exists():
        print(
            f"PptxIngester sample file not found: {sample_pptx}\n"
            "Please replace `sample_pptx` with a real file path before running."
        )
        sys.exit(1)

    ing = PptxIngester()
    try:
        docs = ing.ingest(str(sample_pptx))
        print(f"Loaded and chunked {len(docs)} document(s).")
        if docs:
            print(docs[0].page_content[:400])
    except Exception as exc:  # pragma: no cover - example-only
        print("PptxIngester example failed:", type(exc).__name__, exc)
        print(
            "If this error mentions Docling, install docling and its extras per README."
        )
