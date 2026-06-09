import React, { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../services/axios';
import { Flashcards, generateFlashcards, getFlashcards } from '../../../services/endpoints/artifacts';
import type { SessionDetail } from '../../../services/endpoints/sessions';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

interface FlashcardsViewProps {
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

export function FlashcardsView({ session, onGenerated }: FlashcardsViewProps) {
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deck, setDeck] = useState<Flashcards | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFlashcards = Boolean(session?.artifacts?.flashcards);

  useEffect(() => {
    let alive = true;

    async function loadExistingDeck() {
      if (!session?.id) {
        setDeck(null);
        setLoadingExisting(false);
        setError(null);
        return;
      }

      setDeck(null);

      if (!hasFlashcards) {
        setLoadingExisting(false);
        setError(null);
        return;
      }

      setLoadingExisting(true);
      setError(null);

      try {
        const existingDeck = await getFlashcards(session.id).catch((err) =>
          isNotFoundError(err) ? null : Promise.reject(err),
        );

        if (!alive) return;

        if (existingDeck) {
          setDeck(existingDeck);
          setCi(0);
          setFlipped(false);
        }
      } catch (err) {
        if (!alive) return;
        setError(getErrorMessage(err));
      } finally {
        if (alive) setLoadingExisting(false);
      }
    }

    loadExistingDeck();

    return () => {
      alive = false;
    };
  }, [session?.id, hasFlashcards]);

  const handleGenerate = async () => {
    if (!session?.id) return;

    setGenerating(true);
    setError(null);
    try {
      const generated = await generateFlashcards(session.id);
      setDeck(generated);
      setCi(0);
      setFlipped(false);
      onGenerated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const card = deck?.flashcards?.[ci];
  const total = deck?.flashcards?.length ?? 0;

  const emptyState = useMemo(() => {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>No flashcards yet</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
          Generate flashcards from the current session sources.
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!session?.id || generating}
          style={buttonStyle}
        >
          {generating ? 'Generating flashcards…' : hasFlashcards ? 'Regenerate flashcards' : 'Generate flashcards'}
        </button>
      </div>
    );
  }, [generating, hasFlashcards, session?.id, handleGenerate]);

  if (!session?.id) {
    return <div className="main-pad">Select a session to view flashcards.</div>;
  }

  if (loadingExisting && !deck) {
    return (
      <div>
        {emptyState}
        <div className="main-pad">
          <LoadingSpinner label="Loading flashcards…" />
        </div>
      </div>
    );
  }

  if (!deck || total === 0 || !card) {
    return (
      <div>
        {emptyState}
        {error && <div style={{ ...panelStyle, borderColor: 'color-mix(in srgb, var(--coral) 40%, var(--line))', background: 'color-mix(in srgb, var(--coral) 8%, var(--surface))' }}>{error}</div>}
      </div>
    );
  }

  const prev = () => { setCi((ci - 1 + total) % total); setFlipped(false); };
  const next = () => { setCi((ci + 1) % total); setFlipped(false); };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          style={buttonStyle}
          title={hasFlashcards ? 'Regenerate flashcards' : 'Generate flashcards'}
        >
          {generating ? 'Generating flashcards…' : hasFlashcards ? 'Regenerate flashcards' : 'Generate flashcards'}
        </button>
      </div>

      {error && <div style={{ ...panelStyle, borderColor: 'color-mix(in srgb, var(--coral) 40%, var(--line))', background: 'color-mix(in srgb, var(--coral) 8%, var(--surface))' }}>{error}</div>}

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
        <button className="fc-arrow" onClick={(e) => { e.stopPropagation(); prev(); }} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', minWidth: 60, textAlign: 'center' }}>{ci + 1} / {total}</span>
        <button className="fc-arrow" onClick={(e) => { e.stopPropagation(); next(); }} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  );
}
