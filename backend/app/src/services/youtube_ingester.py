from __future__ import annotations

from typing import Any, Sequence

from langchain_community.document_loaders import YoutubeLoader
from langchain_core.documents import Document

from .base_ingester import BaseIngester


class YouTubeIngester(BaseIngester):
    """Ingest transcripts from YouTube videos."""

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        video_id = self._extract_video_id(source)
        loader = YoutubeLoader(video_id=video_id, **kwargs)
        return loader.load()

    def supported_formats(self) -> Sequence[str]:
        return ["youtube", "youtu.be", "youtube.com"]

    def _extract_video_id(self, source: str) -> str:
        if "youtu.be/" in source:
            return source.split("youtu.be/", 1)[1].split("?")[0]

        if "youtube.com/watch" in source:
            query = source.split("?", 1)[-1]
            for pair in query.split("&"):
                if pair.startswith("v="):
                    return pair.split("=", 1)[1]

        raise ValueError(
            "Invalid YouTube URL. Expected a standard YouTube watch or youtu.be URL."
        )


if __name__ == "__main__":
    """Quick manual test for YouTubeIngester.

    Example usage:
        python -m src.services.youtube_ingester
    """
    sample_url = "https://www.youtube.com/watch?v=abc123"

    print("YouTubeIngester example: extracting video id from a sample URL")
    ing = YouTubeIngester()
    try:
        vid = ing._extract_video_id(sample_url)
        print(f"Source: {sample_url} -> video_id: {vid}")
    except Exception as exc:  # pragma: no cover - example-only
        print("Failed video ID extraction:", type(exc).__name__, exc)

    try:
        docs = ing.ingest(sample_url)
        print(f"Loaded and chunked {len(docs)} document(s).")
        if docs:
            print(docs[0].page_content[:400])
    except Exception as exc:  # pragma: no cover - example-only
        print("YouTubeIngester example failed:", type(exc).__name__, exc)
        print("Ensure network access and required packages are available.")
