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

        # Dispatch bytes to our dedicated heavy-lifter container
        service_url = os.getenv("PARSING_SERVICE_URL", "http://localhost:8080")

        with httpx.Client(timeout=360.0) as client:
            files = {"file": (filename, source, "application/octet-stream")}
            response = client.post(f"{service_url}/parse-to-chunks", files=files)

            if response.status_code != 200:
                raise RuntimeError(f"Docling service failed parsing: {response.text}")

            data = response.json()

        # Rehydrate into LangChain documents
        return [
            Document(page_content=chunk["text"], metadata={"source": filename})
            for chunk in data["chunks"]
        ]
