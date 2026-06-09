from __future__ import annotations

from typing import Any, Sequence

from langchain_core.documents import Document

from .base_ingester import BaseIngester


class YouTubeIngester(BaseIngester):
    """Ingest transcripts from YouTube videos.

    Uses youtube-transcript-api v1.x (fetch() instance method).
    """

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        video_id = self._extract_video_id(source)

        from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

        ytt = YouTubeTranscriptApi()
        try:
            # fetch() returns a FetchedTranscript iterable of snippets with .text
            transcript = ytt.fetch(video_id)
            text = " ".join(snippet.text for snippet in transcript)
        except (NoTranscriptFound, TranscriptsDisabled) as e:
            raise ValueError(
                f"No transcript available for this YouTube video. "
                f"Make sure the video has captions enabled. ({e})"
            )
        except Exception as e:
            raise ValueError(f"Failed to fetch YouTube transcript: {e}")

        if not text.strip():
            raise ValueError("YouTube transcript is empty.")

        return [
            Document(
                page_content=text,
                metadata={"source": source, "source_type": "youtube", "video_id": video_id},
            )
        ]

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
