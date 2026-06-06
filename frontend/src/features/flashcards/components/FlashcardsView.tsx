import React, { useState } from 'react';
import { FLASHCARDS_DATA } from '../data';

export function FlashcardsView() {
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = FLASHCARDS_DATA.length;
  const card = FLASHCARDS_DATA[ci];

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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', minWidth: 60, textAlign: 'center' }}>{ci + 1} / {total}</span>
        <button className="fc-arrow" onClick={(e) => { e.stopPropagation(); next(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
