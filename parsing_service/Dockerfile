FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for some layout libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    libxcb1 \
    libx11-6 \
    && rm -rf /var/lib/apt/lists/*

# Comment out this line if you want to use GPU support (requires a different base image and additional setup)
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch torchvision

# Install docling and chunks
RUN pip install \
    --no-cache-dir \
    --default-timeout=1000 \
    --retries 20 \
    fastapi uvicorn python-multipart docling

# Trigger model pre-download so the container is ready instantly on stack launch
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

COPY main.py .

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]