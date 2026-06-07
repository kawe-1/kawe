import React, { useState, useEffect } from 'react';
import { SessionDetail } from '../../../services/endpoints/sessions';
import { getQuiz, Quiz } from '../../../services/endpoints/artifacts';

export function QuizView({ session }: { session?: SessionDetail | null }) {
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizData, setQuizData] = useState<Quiz | null>(null);

  useEffect(() => {
    if (!session?.id) return;

    if (!session.artifacts?.quiz) {
      setQuizData(null);
      return;
    }

    getQuiz(session.id)
      .then(setQuizData)
      .catch(console.error);
  }, [session]);

  if (!session?.artifacts?.quiz) {
    return (
      <div className="main-pad">
        Quiz has not been generated yet.
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="main-pad">
        Loading quiz...
      </div>
    );
  }

  const q = quizData.questions[qi];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
  };

  const handleNext = () => {
    setQi((qi + 1) % quizData.questions.length);
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div>
      <div className="quiz-progress">
        <span>Question {qi + 1} of {quizData.questions.length}</span>
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${((qi + 1) / quizData.questions.length) * 100}%` }}></div></div>
      </div>
      <div className="quiz-card">
        <div className="q-label">Multiple Choice</div>
        <h3>{q.question}</h3>
        {q.options.map((opt, idx) => {
          let cls = 'q-option';
          if (answered && idx === q.correct) cls += ' correct';
          else if (answered && idx === selected && idx !== q.correct) cls += ' wrong';
          else if (!answered && idx === selected) cls += ' selected';
          return (
            <div key={idx} className={cls} onClick={() => handleSelect(idx)}>
              <span className="q-bullet"></span>
              <span>{opt}</span>
            </div>
          );
        })}
        {answered && (
          <div className={`q-feedback ${selected === q.correct ? 'pass' : 'fail'}`}>
            {selected === q.correct ? 'Correct. ' : 'Not quite. '}{q.explanation}
          </div>
        )}
        <div className="q-nav">
          {answered && (
            <button className="q-btn q-btn-primary" onClick={handleNext}>
              {qi < quizData.questions.length - 1 ? 'Next question' : 'Restart quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
