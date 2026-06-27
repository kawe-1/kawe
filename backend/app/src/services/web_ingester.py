from __future__ import annotations

from typing import Any, Sequence

from langchain_core.documents import Document

from .base_ingester import BaseIngester


class WebIngester(BaseIngester):
    """Ingest documents from a web page URL using requests + BeautifulSoup."""

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        if not source.startswith(("http://", "https://")):
            raise ValueError("WebIngester only accepts http:// or https:// URLs.")

        import requests
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }

        try:
            resp = requests.get(source, headers=headers, timeout=20)
            resp.raise_for_status()
        except requests.RequestException as e:
            raise ValueError(f"Failed to fetch URL: {e}")

        soup = BeautifulSoup(resp.content, "lxml")

        # Drop boilerplate
        for tag in soup(
            ["script", "style", "nav", "footer", "header", "aside", "noscript"]
        ):
            tag.decompose()

        # Prefer <main> or <article> content; fall back to <body>
        content_node = (
            soup.find("main") or soup.find("article") or soup.find("body") or soup
        )
        text = content_node.get_text(separator="\n", strip=True)

        if not text.strip():
            raise ValueError(f"No readable text found at {source}.")

        title = (
            soup.title.string.strip() if soup.title and soup.title.string else source
        )
        print(title[:300])
        return [
            Document(
                page_content=text,
                metadata={"source": source, "source_type": "web", "title": title},
            )
        ]

    def supported_formats(self) -> Sequence[str]:
        return ["http", "https", "url"]
