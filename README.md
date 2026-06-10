# Kawe
Kawe is an AI-powered study companion that helps students learn from multiple learning resources in one place.

Students often rely on a combination of PDFs, lecture notes, videos, webpages, recordings, and personal notes when studying. Switching between these resources creates a fragmented learning experience and makes revision difficult. Kawe brings these materials together into a single study session, allowing learners to interact with their knowledge through conversation, summaries, flashcards, quizzes, and voice-based tutoring.

<p align="center">
  <img width="1420" height="842" alt="hero-final" alt="Kawe Homepage" src="https://github.com/user-attachments/assets/e868d184-3ba6-4ab3-a5eb-88799d737bfb" />
</p>

## Features

### 📚 Multi-Source Learning

Create study sessions from multiple content sources:

* PDF documents
* YouTube videos
* Audio recordings
* Images of notes
* Web pages

All uploaded content becomes part of a single learning workspace.

### 💬 AI Tutor Chat

Ask questions about your study materials in natural language.

The tutor grounds its responses in the content uploaded to the session, helping students explore concepts, clarify confusion, and learn more effectively.

### 📝 AI Study Notes

Generate structured notes from all materials within a study session.

Notes provide a consolidated overview of key ideas, concepts, and explanations extracted from the uploaded sources.

### 💡 Concept Simplification

Break down complex topics into simpler explanations.

Useful for understanding difficult technical concepts and building foundational knowledge.

### 🎯 Quiz Generation

Generate revision quizzes directly from study materials.

Quizzes help learners assess understanding and identify knowledge gaps.

### 🧠 Flashcards

Generate flashcards covering important concepts, definitions, and facts.

Designed to support active recall and long-term retention.

### 🎙️ Voice Tutor

Interact with the AI tutor using natural speech.

Students can ask questions verbally and receive spoken responses, creating a more natural and engaging learning experience.

## How It Works

1. Create a study session.
2. Upload learning materials from multiple sources.
3. Kawe processes the content into a unified knowledge base.
4. Interact with the material through chat, notes, quizzes, flashcards, and voice tutoring.

## Getting Started

Kawe can be run either locally using your standard Python & Node.js terminals or entirely containerized using Docker Compose. 

### ⚙️ Environment Configuration
Before launching the application, create a `.env` file in the root directory of the project (and copy appropriate values to `./backend/.env` if running outside Docker).

| Variable Name | Description / Allowed Values | Default / Recommendation |
| :--- | :--- | :--- |
| `VITE_USE_MOCK` | Set to `true` to run the frontend entirely on mock data, or `false` to hit the real backend API. | `false` |
| `PARSING_SERVICE_URL`| Points the backend to your Docling layout extractor. Use `http://localhost:8080` if running the backend on your host terminal, or `http://docling-service:8080` if running inside a full Docker stack. | `http://localhost:8080` |
| `GOOGLE_API_KEY` | Required if your backend triggers Gemini models or LLM ingestion routines. | `your_gemini_api_key` |
| `HF_TOKEN` | Optional (HuggingFace Hub Token). Avoids rate limits when downloading the layout models. | `your_huggingface_token` |

---

### 🐳 Option 1: Running with Docker (Recommended)
This approach launches the entire platform (Frontend, Core API, and Docling Document Parser) in separate, isolated virtual networks without installing packages locally.

#### Prerequisites
* [Docker Desktop installed and running](https://www.docker.com/products/docker-desktop/)

#### ⚠️ Important Nuances regarding the Parsing Service
* **Initial Build Warning:** Because the layout parsing service must fetch PyTorch and pre-download heavy machine learning extraction weights directly into the container image, **the first `docker compose build` can take between 15 to 30 minutes depending on your internet connection speed.** Once compiled successfully, it is cached permanently and subsequent launches take less than 5 seconds.
* **CPU Optimization:** By default, the parsing container is heavily optimized for lightweight infrastructure and forces **CPU-only math kernels**. If you have an NVIDIA graphics card and want to leverage hardware-accelerated GPU parsing, open `parsing_service/Dockerfile` and follow the commented instructions to modify the base image and remove the specialized `--index-url https://download.pytorch.org/whl/cpu` lines.
* **Partial Mode Standalone Run:** If you do not have Docker installed or want to save compute resources, **you can launch Kawe without the docling-service container.** Without it, the application remains fully functional for Audio recordings, Images of notes, Webpages, and YouTube processing. Only rich text layouts (like PDFs or complex Word documents) require the active parsing service.

#### Spin up the entire stack
To compile the environment and start all services simultaneously, execute:
```bash
docker compose up --build
```

### 💻 Option 2: Running via Local Terminal
If you prefer traditional virtual environments or want to write and modify core features iteratively without containers, use this workflow.

### Backend Setup

From the project root, enter the backend folder and create a virtual environment:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

#### Windows

```bash
.venv\Scripts\activate
```

#### Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the development server:

```bash
python -m uvicorn app.src.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

### Frontend

Navigate into the frontend project root, install packages, and initiate the preview/development live-reloader:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

## Project Structure

The project consists of:

* Frontend application (React + TypeScript)
* Backend API (FastAPI)
* AI services for retrieval, tutoring, and artifact generation
* Multi-source content ingestion pipeline

## Contributing

Contributions, feedback, and feature requests are welcome.

## License

This project is licensed under the project's chosen license.
