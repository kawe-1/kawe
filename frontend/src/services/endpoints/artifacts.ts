import api from "../axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NoteSection {
  heading: string;
  body: string;
  cite: string;
}

export interface Notes {
  sections: NoteSection[];
}

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  quizzes: QuizQuestion[];
}

export interface GenerateQuizRequest {
  num_questions?: number;
  difficulty?: QuizDifficulty;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Flashcards {
  flashcards: Flashcard[];
}

export interface Concept {
  term: string;
  explanation: string;
}

export interface Concepts {
  concepts: Concept[];
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/notes
 * Trigger AI generation of fused notes from all ingested sources.
 */
export async function generateNotes(sessionId: string): Promise<Notes> {
  const { data } = await api.post<Notes>(`/api/sessions/${sessionId}/notes`);
  return data;
}

/**
 * GET /api/sessions/:sessionId/notes
 * Fetch previously generated notes. Throws 404 if not yet generated.
 */
export async function getNotes(sessionId: string): Promise<Notes> {
  const { data } = await api.get<Notes>(`/api/sessions/${sessionId}/notes`);
  return data;
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/quiz
 * Generate a multiple-choice quiz from session sources.
 */
export async function generateQuiz(
  sessionId: string,
  options: GenerateQuizRequest = {},
): Promise<Quiz> {
  const payload = {
    num_questions: options.num_questions ?? 5,
    difficulty: options.difficulty ?? "medium",
  };

  const { data } = await api.post<Quiz>(
    `/api/sessions/${sessionId}/quiz`,
    payload,
  );
  return data;
}

/**
 * GET /api/sessions/:sessionId/quiz
 * Fetch previously generated quiz. Throws 404 if not yet generated.
 */
export async function getQuiz(sessionId: string): Promise<Quiz> {
  const { data } = await api.get<Quiz>(`/api/sessions/${sessionId}/quiz`);
  return data;
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/flashcards
 * Generate a flashcard deck from session sources.
 */
export async function generateFlashcards(
  sessionId: string,
): Promise<Flashcards> {
  const { data } = await api.post<Flashcards>(
    `/api/sessions/${sessionId}/flashcards`,
  );
  return data;
}

/**
 * GET /api/sessions/:sessionId/flashcards
 * Fetch previously generated flashcard deck. Throws 404 if not yet generated.
 */
export async function getFlashcards(sessionId: string): Promise<Flashcards> {
  const { data } = await api.get<Flashcards>(
    `/api/sessions/${sessionId}/flashcards`,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/concepts
 * Generate key concept definitions from session sources.
 */
export async function generateConcepts(sessionId: string): Promise<Concepts> {
  const { data } = await api.post<Concepts>(
    `/api/sessions/${sessionId}/concepts`,
  );
  return data;
}

/**
 * GET /api/sessions/:sessionId/concepts
 * Fetch previously generated concepts. Throws 404 if not yet generated.
 */
export async function getConcepts(sessionId: string): Promise<Concepts> {
  const { data } = await api.get<Concepts>(
    `/api/sessions/${sessionId}/concepts`,
  );
  return data;
}
