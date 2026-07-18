import os
from typing import Any, Sequence

import httpx
from langchain_core.documents import Document

from .base_ingester import BaseIngester


class DoclingFileIngester(BaseIngester):
    source_type: str
    supported_extensions: set[str] = {".pdf", ".docx", ".pptx", ".html", ".htm"}

    def load(self, source: str, **kwargs: Any) -> Sequence[Document]:
        filename = kwargs.get("name", "file")

        if not source:
            raise ValueError("In-memory file bytes are required for remote parsing.")

        service_url = os.getenv("PARSING_SERVICE_URL", "http://localhost:8080")
        api_key = os.getenv("DOCLING_API_KEY")

        if not api_key:
            raise RuntimeError("DOCLING_API_KEY environment variable is not set.")

        headers = {"Authorization": f"Bearer {api_key}"}

        with httpx.Client(timeout=360.0) as client:
            files = {
                "file": (
                    filename,
                    source,
                    "application/octet-stream",
                )
            }

            response = client.post(
                f"{service_url}/parse-to-chunks",
                files=files,
                headers=headers,
            )

            response.raise_for_status()

            data = response.json()

        return [
            Document(
                page_content=chunk["text"],
                metadata={"source": filename},
            )
            for chunk in data["chunks"]
        ]

