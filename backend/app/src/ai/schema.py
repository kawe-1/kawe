from __future__ import annotations

from pydantic import BaseModel


class NoteSection(BaseModel):
    heading: str
    body: str
    cite: str


class Notes(BaseModel):
    sections: list[NoteSection]


class Summary(BaseModel):
    title: str
    overview: str
    key_points: list[str]


class QuizQuestion(BaseModel):
    question: str
    choices: list[str]
    correct_answer: str
    explanation: str


class Quiz(BaseModel):
    quizzes: list[QuizQuestion]


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardDeck(BaseModel):
    flashcards: list[Flashcard]


class ConceptSimplification(BaseModel):
    term: str
    explanation: str


class ConceptDeck(BaseModel):
    concepts: list[ConceptSimplification]
