export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizData extends QuizQuestion {}

export interface QuizDeck {
  questions: QuizQuestion[];
}
