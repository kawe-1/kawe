import React, { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../services/axios';
import type { SessionDetail } from '../../../services/endpoints/sessions';
import {
  generateQuiz,
  getQuiz,
  type Quiz,
  type QuizDifficulty,
} from '../../../services/endpoints/artifacts';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

interface QuizViewProps {
  session?: SessionDetail | null;
  onGenerated?: () => void;
}

function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '18px',
  background: 'var(--surface)',
};

const buttonStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  background: 'var(--bg2)',
  color: 'var(--ink)',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  fontWeight: 500,
};

export function QuizView({ session, onGenerated }: QuizViewProps) {
  const [qi, setQi] = useState(0);
  // TRACKING FIX: track selected option as a string matching the chosen option text
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasQuiz = Boolean(session?.artifacts?.quiz);

  useEffect(() => {
    let alive = true;

    async function loadExistingQuiz() {
      if (!session?.id) {
        setQuizData(null);
        setLoadingExisting(false);
        setError(null);
        return;
      }

      setQuizData(null);

      if (!hasQuiz) {
        setLoadingExisting(false);
        setError(null);
        return;
      }

      setLoadingExisting(true);
      setError(null);

      try {
        const quiz = await getQuiz(session.id).catch((err) =>
          isNotFoundError(err) ? null : Promise.reject(err),
        );

        if (!alive) return;
        if (quiz) {
          setQuizData(quiz);
          setQi(0);
          setSelected(null);
          setAnswered(false);
        }
      } catch (err) {
        if (!alive) return;
        setError(getErrorMessage(err));
      } finally {
        if (alive) setLoadingExisting(false);
      }
    }

    loadExistingQuiz();

    return () => {
      alive = false;
    };
  }, [session?.id, hasQuiz]);

  const handleGenerate = async () => {
    if (!session?.id) return;

    setGenerating(true);
    setError(null);
    try {
      const quiz = await generateQuiz(session.id, {
        num_questions: questionCount,
        difficulty,
      });
      setQuizData(quiz);
      setQi(0);
      setSelected(null);
      setAnswered(false);
      onGenerated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (optionValue: string) => {
    if (answered) return;
    setSelected(optionValue);
    setAnswered(true);
  };

  const handleNext = () => {
    if (!quizData || !quizData.quizzes) return;
    setQi((qi + 1) % quizData.quizzes.length);
    setSelected(null);
    setAnswered(false);
  };

  const generatorPanel = useMemo(() => {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Generate quiz</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
            Number of questions
            <input
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
              style={inputStyle}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!session?.id || generating}
          style={buttonStyle}
          title={hasQuiz ? 'Regenerate quiz' : 'Generate quiz'}
        >
          {generating ? 'Generating quiz…' : hasQuiz ? 'Regenerate quiz' : 'Generate quiz'}
        </button>
      </div>
    );
  }, [questionCount, difficulty, generating, hasQuiz, session?.id]);

  if (!session?.id) {
    return <div className="main-pad">Select a session to view the quiz.</div>;
  }

  if (loadingExisting && !quizData) {
    return (
      <div>
        {generatorPanel}
        <div className="main-pad">
          <LoadingSpinner label="Loading quiz…" />
        </div>
      </div>
    );
  }

  // STRUCTURAL DEFENSE: Validate that questions array exists safely
  if (!quizData || !quizData.quizzes || quizData.quizzes.length === 0) {
    return (
      <div>
        {generatorPanel}
        {error && <div style={{ ...panelStyle, borderColor: 'color-mix(in srgb, var(--coral) 40%, var(--line))', background: 'color-mix(in srgb, var(--coral) 8%, var(--surface))' }}>{error}</div>}
        <div className="main-pad">No quiz has been generated yet.</div>
      </div>
    );
  }

  const q = quizData.quizzes[qi];

  // Fallback protection if index pointer is out of bounds
  if (!q) {
    return <div className="main-pad">Error loading question template.</div>;
  }

  const totalQuestions = quizData.quizzes.length;
  const isCorrectSelection = selected === q.correct_answer;

  return (
    <div>
      {generatorPanel}
      {error && <div style={{ ...panelStyle, borderColor: 'color-mix(in srgb, var(--coral) 40%, var(--line))', background: 'color-mix(in srgb, var(--coral) 8%, var(--surface))' }}>{error}</div>}
      <div className="quiz-progress">
        <span>Question {qi + 1} of {totalQuestions}</span>
        <div className="quiz-bar">
          <div className="quiz-fill" style={{ width: `${((qi + 1) / totalQuestions) * 100}%` }}></div>
        </div>
      </div>
      <div className="quiz-card">
        <div className="q-label">Multiple Choice</div>
        <h3>{q.question}</h3>
        {q.choices.map((opt, idx) => {
          let cls = 'q-option';

          // COMPARISON REWRITE: Evaluate string values instead of numerical indices
          if (answered && opt === q.correct_answer) {
            cls += ' correct_answer';
          } else if (answered && opt === selected && opt !== q.correct_answer) {
            cls += ' wrong';
          } else if (!answered && opt === selected) {
            cls += ' selected';
          }

          return (
            <div key={idx} className={cls} onClick={() => handleSelect(opt)}>
              <span className="q-bullet"></span>
              <span>{opt}</span>
            </div>
          );
        })}

        {answered && (
          <div className={`q-feedback ${isCorrectSelection ? 'pass' : 'fail'}`}>
            {isCorrectSelection ? 'Correct! ' : 'Not quite. '}{q.explanation}
          </div>
        )}

        <div className="q-nav">
          {answered && (
            <button className="q-btn q-btn-primary" onClick={handleNext} type="button">
              {qi < totalQuestions - 1 ? 'Next question' : 'Restart quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}