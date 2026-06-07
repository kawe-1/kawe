from __future__ import annotations

import io
import os
from abc import ABC, abstractmethod
from typing import Any, Sequence

from langchain_core.documents import Document

from .base_ingester import BaseIngester


class OCRProvider(ABC):
    """Abstract base class for OCR transcription providers accepting bytes."""

    @abstractmethod
    def extract_text(self, image_bytes: bytes, **kwargs: Any) -> str:
        """Extract and return text content from the given image bytes."""
        pass


class MockOCRProvider(OCRProvider):
    """Mock OCR provider for local testing and fallback."""

    def extract_text(self, image_bytes: bytes, **kwargs: Any) -> str:
        return "This is a mock OCR transcription response from the image bytes."


class GeminiOCRProvider(OCRProvider):
    """OCR provider utilizing vision-capable Gemini models directly from memory bytes."""

    def extract_text(self, image_bytes: bytes, **kwargs: Any) -> str:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set.")

        from google import genai
        from PIL import Image

        client = genai.Client(api_key=api_key)

        # 1. Convert raw bytes into an in-memory stream wrapper
        byte_stream = io.BytesIO(image_bytes)

        # 2. Open the image directly from memory
        img = Image.open(byte_stream)

        # 3. Stream the Pillow Image object directly to Gemini's content array
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                img,
                "Extract and transcribe all text from this image. Maintain structure, markdown headings, lists, tables, and spacing. Return ONLY the transcribed text without conversational prefixes.",
            ],
        )
        return response.text or ""


class ImageIngester(BaseIngester):
    """Ingester for extracting text content from images using entirely in-memory OCR."""

    def __init__(self, provider: OCRProvider | None = None):
        self.provider = provider or (
            GeminiOCRProvider() if os.getenv("GOOGLE_API_KEY") else MockOCRProvider()
        )

    def load(
        self, file_bytes: bytes, filename: str, **kwargs: Any
    ) -> Sequence[Document]:
        """
        Accepts raw file bytes and the original filename.
        Bypasses local OS temporary files entirely.
        """
        suffix = f".{filename.split('.')[-1].lower()}" if "." in filename else ""
        if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
            raise ValueError(
                "ImageIngester only accepts .png, .jpg, .jpeg, or .webp files."
            )

        # Extract text directly from memory bytes
        extracted_text = self.provider.extract_text(file_bytes, **kwargs)

        return [
            Document(
                page_content=extracted_text,
                metadata={
                    "source_type": "image",
                    "provider": self.provider.__class__.__name__,
                    "filename": filename,
                },
            )
        ]

    def supported_formats(self) -> Sequence[str]:
        return ["png", "jpg", "jpeg", "webp"]


if __name__ == "__main__":
    # Quick verification using mock components
    mock_ingester = ImageIngester(MockOCRProvider())
    try:
        fake_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR..."
        docs = mock_ingester.load_from_bytes(
            file_bytes=fake_png_bytes,
            filename="scanned_invoice.png",
        )
        print(f"Loaded {len(docs)} document(s).")
        print("Content:", docs[0].page_content)
        print("Metadata:", docs[0].metadata)
    except Exception as exc:
        print("ImageIngester example failed:", type(exc).__name__, exc)
