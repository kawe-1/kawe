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

### Backend

Create a virtual environment:

```bash
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

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
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
