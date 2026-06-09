import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from docling.document_converter import DocumentConverter
from docling.chunking import HybridChunker

app = FastAPI(title="Docling Parsing Service")

# Initialize the converter globally once when the container boots
converter = DocumentConverter()
chunker = HybridChunker()

@app.post("/parse-to-markdown")
async def parse_to_markdown(file: UploadFile = File(...)):
    try:
        # Read file stream from the main application
        contents = await file.read()
        
        # Docling can convert directly from memory using BytesIO
        from docling.datamodel.base_models import DocumentStream
        source = DocumentStream(name=file.filename, stream=io.BytesIO(contents))
        
        # Convert and render to Markdown
        result = converter.convert(source)
        markdown_text = result.document.export_to_markdown()
        
        return {"markdown": markdown_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-to-chunks")
async def parse_to_chunks(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        from docling.datamodel.base_models import DocumentStream
        source = DocumentStream(name=file.filename, stream=io.BytesIO(contents))
        
        result = converter.convert(source)
        
        # Leverage Docling's awesome semantic layout chunker directly!
        chunks = []
        for chunk in chunker.chunk(result.document):
            chunks.append({
                "text": chunk.text,
                "meta": chunk.meta.json() if hasattr(chunk.meta, 'json') else str(chunk.meta)
            })
            
        return {"chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))