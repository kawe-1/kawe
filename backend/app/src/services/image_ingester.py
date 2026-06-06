from __future__ import annotations

import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Sequence

from langchain_core.documents import Document
from .base_ingester import BaseIngester


class OCRProvider(ABC):
    """Abstract base class for OCR transcription providers."""

    @abstractmethod
    def extract_text(self, image_file_path: str, **kwargs: Any) -> str:
        """Extract and return text content from the given image."""
        pass


class MockOCRProvider(OCRProvider):
    """Mock OCR provider for local testing and fallback."""

    def extract_text(self, image_file_path: str, **kwargs: Any) -> str:
        return "This is a mock OCR transcription response from the image."


class GeminiOCRProvider(OCRProvider):
    """OCR provider that leverages vision-capable Gemini model for high-accuracy text extraction."""

    def extract_text(self, image_file_path: str, **kwargs: Any) -> str:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set.")

        from google import genai
        from PIL import Image

        client = genai.Client(api_key=api_key)
        img = Image.open(image_file_path)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[img, "Extract and transcribe all text from this image. Maintain structure, markdown headings, lists, tables, and spacing. Return ONLY the transcribed text without conversational prefixes."]
        )
        return response.text or ""


class ImageIngester(BaseIngester):
    """Ingester for extracting text content from images (PNG, JPG, JPEG, WEBP) using OCR."""

    def __init__(self, provider: OCRProvider | None = None):
        self.provider = provider or (
            GeminiOCRProvider() if os.getenv("GOOGLE_API_KEY") else MockOCRProvider()
        )

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        path = Path(source)
        suffix = path.suffix.lower()
        if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
            raise ValueError("ImageIngester only accepts .png, .jpg, .jpeg, or .webp files.")

        extracted_text = self.provider.extract_text(source, **kwargs)

        return [
            Document(
                page_content=extracted_text,
                metadata={
                    "source_type": "image",
                    "provider": self.provider.__class__.__name__,
                    "filename": path.name,
                },
            )
        ]

    def supported_formats(self) -> Sequence[str]:
        return ["png", "jpg", "jpeg", "webp"]
