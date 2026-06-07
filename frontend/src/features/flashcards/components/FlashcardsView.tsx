import React, { useEffect, useState } from "react";
import { getFlashcards, Flashcards } from "../../../services/endpoints/artifacts";
import type { SessionDetail } from '../../../services/endpoints/sessions';


export function FlashcardsView({ session }: { session?: SessionDetail | null }) {
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [data, setData] = useState<Flashcards | null>(null);

  useEffect(() => {
    if (!session?.id) return;

    if (!session.artifacts?.flashcards) {
      setData(null);
      return;
    }

    getFlashcards(session.id)
      .then(setData)
      .catch(console.error);
  }, [session]);

  if (!session?.artifacts?.flashcards) {
    return (
      <div className="main-pad">
        Flashcards have not been generated yet.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="main-pad">
        Loading flashcards...
      </div>
    );
  }
  const total = data?.cards.length;
  const card = data?.cards[ci];

  const prev = () => { setCi((ci - 1 + total) % total); setFlipped(false); };
  const next = () => { setCi((ci + 1) % total); setFlipped(false); };

  return (
    <div>
      <div className="fc-counter">Card {ci + 1} of {total}</div>
      <div className="fc-stage" onClick={() => setFlipped(!flipped)}>
        <div className={`fc-inner${flipped ? ' flipped' : ''}`}>
          <div className="fc-face fc-front">
            <div className="fc-label">Question</div>
            <div className="fc-text">{card.front}</div>
            <div className="fc-hint">Tap to reveal</div>
          </div>
          <div className="fc-face fc-back">
            <div className="fc-label">Answer</div>
            <div className="fc-text">{card.back}</div>
          </div>
        </div>
      </div>
      <div className="fc-nav">
        <button className="fc-arrow" onClick={(e) => { e.stopPropagation(); prev(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', minWidth: 60, textAlign: 'center' }}>{ci + 1} / {total}</span>
        <button className="fc-arrow" onClick={(e) => { e.stopPropagation(); next(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  );
}
