---
applyTo: "**"
---

# Ingester Services

This document captures the external tools, integrations, and implementation patterns used by the Study Companion backend.

The goal is to provide developers and AI coding agents with enough context to understand how each ingestion source should be implemented and extended.

---

# Document Ingestion

## Objective

Extract structured content from uploaded learning materials and convert them into LangChain Documents for downstream processing.

## Supported Formats

* PDF
* DOCX
* PPTX
* HTML

## Recommended Loader

Docling

## Code Example (Only use for reference)
```from docling_core.types.doc import ImageRefMode, PictureItem, TableItem

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

_log = logging.getLogger(__name__)

IMAGE_RESOLUTION_SCALE = 2.0


def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Keep page/element images so they can be exported. The `images_scale` controls
    # the rendered image resolution (scale=1 ~ 72 DPI). The `generate_*` toggles
    # decide which elements are enriched with images.
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True
    pipeline_options.generate_picture_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = conv_res.input.file.stem

    # Save page images
    for page_no, page in conv_res.document.pages.items():
        page_no = page.page_no
        page_image_filename = output_dir / f"{doc_filename}-{page_no}.png"
        with page_image_filename.open("wb") as fp:
            page.image.pil_image.save(fp, format="PNG")

    # Save images of figures and tables
    table_counter = 0
    picture_counter = 0
    for element, _level in conv_res.document.iterate_items():
        if isinstance(element, TableItem):
            table_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-table-{table_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(conv_res.document).save(fp, "PNG")

        if isinstance(element, PictureItem):
            picture_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-picture-{picture_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(conv_res.document).save(fp, "PNG")

    # Save markdown with embedded pictures
    md_filename = output_dir / f"{doc_filename}-with-images.md"
    conv_res.document.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    # Save markdown with externally referenced pictures
    md_filename = output_dir / f"{doc_filename}-with-image-refs.md"
    conv_res.document.save_as_markdown(md_filename, image_mode=ImageRefMode.REFERENCED)

    # Save HTML with externally referenced pictures
    html_filename = output_dir / f"{doc_filename}-with-image-refs.html"
    conv_res.document.save_as_html(html_filename, image_mode=ImageRefMode.REFERENCED)

    end_time = time.time() - start_time

    _log.info(f"Document converted and figures exported in {end_time:.2f} seconds.")
```

## Website Reference
https://docling-project.github.io/docling/examples/agent_skill/docling-document-intelligence/SKILL/

## Expected Output

```text
File
  ↓
Docling Loader
  ↓
LangChain Documents
  ↓
Chunking
  ↓
Embeddings
```

## Notes

* Prefer Docling over format-specific loaders.
* Maintain source metadata.
* Preserve document structure where possible.
* All extracted content should become framework-agnostic Documents.

---

# YouTube Ingestion

## Objective

Convert educational videos into retrievable learning material.

## Recommended Loader

YoutubeLoaderDL

Documentation:

https://docs.langchain.com/oss/python/integrations/document_loaders/yt_dlp

## Expected Output

```text
YouTube URL
    ↓
YoutubeLoaderDL
    ↓
Transcript
    ↓
LangChain Documents
```

## Notes

* Use transcript/caption extraction where available.
* Preserve video metadata.
* Normalize output into the same document format used by all ingestion pipelines.

---
# Web Ingestion

## Objective

Convert educational web pages and online resources into retrievable learning material.

## Recommended Loader

WebBaseLoader

Documentation:

https://docs.langchain.com/oss/python/integrations/document_loaders/web_base

## Expected Output

```text
URL
  ↓
WebBaseLoader
  ↓
LangChain Documents
```

## Notes

* Preserve source URL and page metadata.
* Normalize output into the same document format used by all ingestion pipelines.
* Extracted content should be compatible with downstream chunking and embedding workflows.
* Suitable for blogs, documentation, articles, and educational websites.

---

# Audio Ingestion

## Objective

Convert lecture recordings into searchable knowledge.

## Design Requirement

Audio transcription must be provider-agnostic.

The application should not directly depend on any single speech-to-text provider.

## Initial Provider

Sponsor Voice API

## Future Providers

* OpenAI Whisper
* Deepgram
* AssemblyAI
* Other STT providers

## Expected Interface

```python
class AudioTranscriptionProvider:
    def transcribe(self, audio_file):
        pass
```

## Expected Output

```text
Audio File
    ↓
Transcription Provider
    ↓
Transcript
    ↓
LangChain Documents
```

## Notes

* All providers should return a common transcript format.
* Business logic should never depend on provider-specific response structures.
* Swapping providers should require minimal code changes.

---

# OCR / Image Ingestion

## Objective

Extract knowledge from handwritten notes, screenshots, whiteboards, and scanned documents.

## Design Requirement

OCR must be framework and model agnostic.

The system should support both traditional OCR engines and multimodal LLMs.

## Possible Providers

* GPT-4o
* Gemini
* Claude
* PaddleOCR
* Tesseract

## Expected Interface

```python
class OCRProvider:
    def extract_text(self, image_file):
        pass
```

## Expected Output

```text
Image
   ↓
OCR Provider
   ↓
Extracted Text
   ↓
LangChain Documents
```

## Notes

* Prefer vision-capable LLMs when available.
* Maintain provider abstraction.
* Downstream services should consume normalized text only.

---

# Unified Knowledge Base

## Objective

Ensure every ingestion source produces the same output format.

Regardless of source:

* PDF
* DOCX
* PPTX
* HTML
* Audio
* YouTube
* OCR Images

Everything should eventually become:

```text
Source
   ↓
LangChain Documents
   ↓
Chunking
   ↓
Embeddings
   ↓
Vector Store
```

This guarantees that notes generation, quizzes, flashcards, chat, and voice tutoring operate on a single unified knowledge base.

---

# Reference Architecture

```text
Document Sources
Audio Sources
YouTube Sources
Image Sources
        ↓
Source-Specific Extraction
        ↓
LangChain Documents
        ↓
Chunking
        ↓
Embeddings
        ↓
Unified Knowledge Base
        ↓
AI Tutor Features
```
