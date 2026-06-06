from __future__ import annotations

from typing import Any, Sequence

from .base_ingester import BaseIngester
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document


class WebIngester(BaseIngester):
    """Ingest documents from a web page URL."""

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        if not source.startswith(("http://", "https://")):
            raise ValueError("WebIngester only accepts http:// or https:// URLs.")

        loader = WebBaseLoader(web_path=source, **kwargs)
        return loader.load()

    def supported_formats(self) -> Sequence[str]:
        return ["http", "https", "url"]


if __name__ == "__main__":
    """Quick manual test for WebIngester.

    Example usage:
        python -m src.services.web_ingester
    """
    web_url = "https://cmav08.github.io/blog/posts/personal/stuck_in_a_local_minima/"

    print(f"WebIngester example: fetching {web_url}")
    ing = WebIngester()
    try:
        docs = ing.ingest(web_url)
        print(f"Loaded and chunked {len(docs)} document(s).")
        if docs:
            print(docs[0].page_content[:400])
    except Exception as exc:  # pragma: no cover - example-only
        print("WebIngester example failed:", type(exc).__name__, exc)
        print("Ensure network access and required packages are available.")
