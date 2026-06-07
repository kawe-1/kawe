import io
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
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
    provider_metadata: dict[str, Any] = None


class AudioTranscriptionProvider(ABC):
    """Abstract interface for audio transcription providers accepting bytes."""

    @abstractmethod
    def transcribe(
        self, audio_bytes: bytes, mime_type: str, **kwargs: Any
    ) -> TranscriptResult:
        """Transcribe raw audio bytes and return the transcript text."""


class MockProvider(AudioTranscriptionProvider):
    """Mock provider for testing."""

    def transcribe(
        self, audio_bytes: bytes, mime_type: str, **kwargs: Any
    ) -> TranscriptResult:
        return TranscriptResult(text="This is a mock response from byte data")


class GeminiTranscriptionProvider(AudioTranscriptionProvider):
    """Transcription provider utilizing Gemini's native File API using raw byte streams."""

    def transcribe(
        self, audio_bytes: bytes, mime_type: str, **kwargs: Any
    ) -> TranscriptResult:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set.")

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # 1. Convert bytes into an in-memory stream wrapper
        byte_stream = io.BytesIO(audio_bytes)

        # 2. Upload using config. MIME type is mandatory since there is no path string extension.
        file_ref = client.files.upload(
            file=byte_stream, config=types.UploadFileConfig(mime_type=mime_type)
        )

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    file_ref,
                    "Transcribe this audio file. Output ONLY the raw transcript text. Do not summarize or add commentary.",
                ],
            )
            text = response.text or ""
        finally:
            # Always ensure temporary API storage files are cleaned up safely
            try:
                client.files.delete(name=file_ref.name)
            except Exception:
                pass

        return TranscriptResult(
            text=text, provider_metadata={"gemini_file_name": file_ref.name}
        )


class AudioIngester(BaseIngester):
    """Ingest audio bytes via a pluggable transcription provider."""

    # Standard MIME type lookup dictionary
    MIME_MAP = {
        ".mp3": "audio/mp3",
        ".wav": "audio/wav",
        ".m4a": "audio/m4a",
    }

    def __init__(self, provider: AudioTranscriptionProvider | None = None):
        self.provider = provider or (
            GeminiTranscriptionProvider()
            if os.getenv("GOOGLE_API_KEY")
            else MockProvider()
        )

    def load(
        self, file_bytes: bytes, filename: str, **kwargs: Any
    ) -> Sequence[Document]:
        """
        Accepts raw file bytes and the original filename.
        Bypasses local OS temporary files entirely.
        """
        # Extract extension and validate
        ext = f".{filename.split('.')[-1].lower()}" if "." in filename else ""
        if ext not in self.MIME_MAP:
            raise ValueError(
                f"AudioIngester only accepts formats: {list(self.MIME_MAP.keys())}"
            )

        mime_type = self.MIME_MAP[ext]

        # Transcribe directly from memory bytes
        result = self.provider.transcribe(file_bytes, mime_type=mime_type, **kwargs)

        return [
            Document(
                page_content=result.text,
                metadata={
                    "source_type": "audio",
                    "filename": filename,
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
    mock_ingester = AudioIngester(MockProvider())
    try:
        fake_mp3_bytes = b"ID3FakeAudioDataStream..."
        docs = mock_ingester.load_from_bytes(
            file_bytes=fake_mp3_bytes,
            filename="meeting_recording.mp3",
        )
        print(f"Loaded {len(docs)} document(s).")
        print("Content:", docs[0].page_content)
        print("Metadata:", docs[0].metadata)
    except Exception as exc:
        print("AudioIngester example failed:", type(exc).__name__, exc)
