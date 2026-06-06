import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Sequence

from langchain_core.documents import Document

from .base_ingester import BaseIngester


@dataclass
class TranscriptResult:
    """Unified result from any provider."""

    text: str
    language: str = "en"
    duration_seconds: Optional[float] = None
    confidence: Optional[float] = None
    provider_metadata: dict[str, Any] = None  # provider-specific extras


class AudioTranscriptionProvider(ABC):
    """Abstract interface for audio transcription providers."""

    @abstractmethod
    def transcribe(self, audio_file_path: str, **kwargs: Any) -> TranscriptResult:
        """Transcribe audio and return the transcript text."""


class MockProvider(AudioTranscriptionProvider):
    """Mock provider for testing."""

    def transcribe(self, audio_file_path: str, **kwargs: Any) -> TranscriptResult:
        return TranscriptResult(text="This is a mock response")


class GeminiTranscriptionProvider(AudioTranscriptionProvider):
    """Transcription provider utilizing the Gemini model's audio capabilities."""

    def transcribe(self, audio_file_path: str, **kwargs: Any) -> TranscriptResult:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set.")

        from google import genai
        client = genai.Client(api_key=api_key)

        file_ref = client.files.upload(file=audio_file_path)

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    file_ref,
                    "Transcribe this audio file. Output ONLY the raw transcript text. Do not summarize or add commentary."
                ]
            )
            text = response.text or ""
        finally:
            try:
                client.files.delete(name=file_ref.name)
            except Exception:
                pass

        return TranscriptResult(
            text=text,
            provider_metadata={"gemini_file_name": file_ref.name}
        )


class AudioIngester(BaseIngester):
    """Ingest audio files via a pluggable transcription provider."""

    def __init__(self, provider: AudioTranscriptionProvider | None = None):
        self.provider = provider or (
            GeminiTranscriptionProvider() if os.getenv("GOOGLE_API_KEY") else MockProvider()
        )

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        # Validate file
        path = Path(source)
        if path.suffix.lower() not in {".mp3", ".wav", ".m4a"}:
            raise ValueError("AudioIngester only accepts audio files.")

        # Transcribe using the provider
        result = self.provider.transcribe(source, **kwargs)

        return [
            Document(
                page_content=result.text,
                metadata={
                    "source_type": "audio",
                    "provider": self.provider.__class__.__name__,
                    "duration_seconds": result.duration_seconds,
                    "language": result.language,
                    **(result.provider_metadata or {}),
                },
            )
        ]

    def supported_formats(self) -> Sequence[str]:
        return ["mp3", "wav", "m4a"]


if __name__ == "__main__":
    # Test with mock
    mock_ingester = AudioIngester(MockProvider())
    try:
        docs = mock_ingester.ingest(
            "test.mp3",
            extra_metadata={"user_id": "123"},
        )
        print(f"Loaded and chunked {len(docs)} document(s).")
        print(docs[0].page_content)
    except Exception as exc:  # pragma: no cover - example-only
        print("AudioIngester example failed:", type(exc).__name__, exc)
