import os
from typing import Dict, Type

from .audio_ingester import AudioIngester
from .base_ingester import BaseIngester
from .docx_ingester import DocxIngester
from .html_ingester import HtmlIngester
from .image_ingester import ImageIngester
from .pdf_ingester import PdfIngester
from .pptx_ingester import PptxIngester


class IngesterRegistry:
    # 1. Map file extensions to their dedicated Concrete Ingester Classes
    EXTENSION_MAP: Dict[str, Type[BaseIngester]] = {
        # Docling-based Document Ingesters
        ".pdf": PdfIngester,
        ".docx": DocxIngester,
        ".pptx": PptxIngester,
        ".html": HtmlIngester,
        # Audio Ingesters
        ".mp3": AudioIngester,
        ".wav": AudioIngester,
        ".m4a": AudioIngester,
        # Image Ingesters
        ".png": ImageIngester,
        ".jpg": ImageIngester,
        ".jpeg": ImageIngester,
        ".webp": ImageIngester,
    }

    @classmethod
    def get_extension(cls, filename: str) -> str:
        """Extracts and normalizes the extension from a string filename."""
        if not filename or "." not in filename:
            return ""
        return os.path.splitext(filename.lower())[1]

    @classmethod
    def get_ingester_class(cls, filename: str) -> Type[BaseIngester]:
        """Looks up and returns the uninstantiated class mapping for a filename."""
        ext = cls.get_extension(filename)
        if ext not in cls.EXTENSION_MAP:
            raise ValueError(f"No ingester registered for extension: '{ext}'")
        return cls.EXTENSION_MAP[ext]
