from __future__ import annotations

from pathlib import Path
from typing import Type

from .base_ingester import BaseIngester
from .docx_ingester import DocxIngester
from .html_ingester import HtmlIngester
from .pdf_ingester import PdfIngester
from .pptx_ingester import PptxIngester
from .web_ingester import WebIngester
from .youtube_ingester import YouTubeIngester
from .image_ingester import ImageIngester


class IngesterRegistry:
    """A small registry to route sources to the correct ingester."""

    EXTENSION_MAP: dict[str, Type[BaseIngester]] = {
        ".pdf": PdfIngester,
        ".docx": DocxIngester,
        ".pptx": PptxIngester,
        ".html": HtmlIngester,
        ".htm": HtmlIngester,
        ".png": ImageIngester,
        ".jpg": ImageIngester,
        ".jpeg": ImageIngester,
        ".webp": ImageIngester,
    }

    @classmethod
    def get_ingester_for_source(cls, source: str) -> BaseIngester:
        if source.startswith(("http://", "https://")):
            return WebIngester()

        if "youtu.be/" in source or "youtube.com/watch" in source:
            return YouTubeIngester()

        suffix = Path(source).suffix.lower()
        if suffix in cls.EXTENSION_MAP:
            return cls.EXTENSION_MAP[suffix]()

        raise ValueError(f"No registered ingester found for source: {source}")

    @classmethod
    def get_supported_formats(cls) -> set[str]:
        return set(cls.EXTENSION_MAP).union(
            {"http", "https", "url", "youtube", "youtu.be", "youtube.com", "png", "jpg", "jpeg", "webp"}
        )
