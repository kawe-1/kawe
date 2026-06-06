# Skills.md

## Structured Artifact Generation

All artifacts should be generated using:

1. Retrieved learning content
2. A dedicated prompt
3. A Pydantic schema
4. Structured model outputs

The model should never return free-form text when a structured artifact is expected.

---

# Design Principles

## Schema First

Every generated artifact must have an explicit schema.

Schemas define:

* Output structure
* Required fields
* Validation rules

Prompts define behavior.

Schemas define shape.

---

## Retrieval Before Generation

Artifact generation should operate on retrieved context rather than raw user uploads.

Expected flow:

```text
Topic Session
      ↓
Knowledge Base
      ↓
Retriever
      ↓
Retrieved Context
      ↓
Artifact Generator
      ↓
Structured Output
```

This ensures generated artifacts remain grounded in the session knowledge base.

---

# Example: Quiz Generation

## Objective

Generate assessment questions from retrieved learning content.

The quiz should:

* Test conceptual understanding
* Encourage critical thinking
* Cover major topics
* Remain grounded in retrieved context

---

## Schema

Example schema:

```python
from pydantic import BaseModel

class Quiz(BaseModel):
    question: str
    choices: list[str]
    correct_answer: str
    explanation: str


class QuizList(BaseModel):
    quizzes: list[Quiz]
```

Expected output:

```json
{
  "quizzes": [
    {
      "question": "...",
      "choices": [
        "...",
        "...",
        "...",
        "..."
      ],
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}
```

---

## Prompt Design

The prompt should define:

* Number of questions
* Difficulty level
* Question style
* Output constraints

Example:

```text
You are a professor.

Using the provided learning content, generate exactly {question_num}
multiple-choice questions.

Requirements:

- Question style: {question_style}
- Difficulty: challenging
- Require reasoning rather than memorization
- Include explanations
- Avoid duplicate concepts
- Return valid JSON only
```

Retrieved Context:

```text
{content}
```

---

## Generation Flow

```text
Retrieved Context
        ↓
Prompt
        ↓
LLM Structured Output
        ↓
Pydantic Validation
        ↓
Quiz Artifact
```

Validation should occur before artifacts are stored or returned to clients.

---

# Flashcard Generation

## Objective

Convert key concepts into active recall cards.

---

## Suggested Schema

```python
from pydantic import BaseModel

class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardDeck(BaseModel):
    flashcards: list[Flashcard]
```

Example:

```json
{
  "flashcards": [
    {
      "front": "What is Ohm's Law?",
      "back": "V = IR"
    }
  ]
}
```

---

## Prompt Goals

Generate cards that:

* Cover core concepts
* Prioritize exam-relevant material
* Avoid trivial facts
* Encourage active recall

---

# Summary Generation

## Objective

Generate concise study notes from retrieved content.

---

## Suggested Schema

```python
from pydantic import BaseModel

class Summary(BaseModel):
    title: str
    overview: str
    key_points: list[str]
```

Example:

```json
{
  "title": "Introduction to Neural Networks",
  "overview": "...",
  "key_points": [
    "...",
    "...",
    "..."
  ]
}
```

---

## Prompt Goals

Summaries should:

* Preserve key concepts
* Reduce unnecessary detail
* Maintain technical accuracy
* Be useful for revision

---