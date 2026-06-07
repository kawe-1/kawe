# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (curl is useful for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create persistent data directory for SQLite database
RUN mkdir -p /app/data

# Copy the requirements file and install dependencies
# Note: build context is ./backend so reference paths relative to that context
COPY env/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the application source code (relative to backend/)
COPY app /app/app

# Expose the API port
EXPOSE 8000

# Run the uvicorn server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
