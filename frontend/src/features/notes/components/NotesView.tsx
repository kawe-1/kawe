import React, { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../services/axios';
import type { SessionDetail } from '../../../services/endpoints/sessions';
import {
  Concepts,
  Notes,
  generateConcepts,
  generateNotes,
  getConcepts,
  getNotes,
} from '../../../services/endpoints/artifacts';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

interface NotesViewProps {
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

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '16px',
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

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'transparent',
};

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '18px',
  background: 'var(--surface)',
};

const errorStyle: React.CSSProperties = {
  ...panelStyle,
  borderColor: 'color-mix(in srgb, var(--coral) 40%, var(--line))',
  background: 'color-mix(in srgb, var(--coral) 8%, var(--surface))',
  color: 'var(--ink)',
};

export function NotesView({ session, onGenerated }: NotesViewProps) {
  const [openConcept, setOpenConcept] = useState<number | null>(null);
  const [notesData, setNotesData] = useState<Notes | null>(null);
  const [conceptsData, setConceptsData] = useState<Concepts | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [generatingConcepts, setGeneratingConcepts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasNotes = Boolean(session?.artifacts?.notes);
  const hasConcepts = Boolean(session?.artifacts?.concepts);

  useEffect(() => {
    let alive = true;

    async function loadExistingArtifacts() {
      if (!session?.id) {
        setNotesData(null);
        setConceptsData(null);
        setLoadingExisting(false);
        setError(null);
        return;
      }

      setNotesData(null);
      setConceptsData(null);

      if (!hasNotes && !hasConcepts) {
        setLoadingExisting(false);
        setError(null);
        return;
      }

      setLoadingExisting(true);
      setError(null);

      try {
        const [notes, concepts] = await Promise.all([
          hasNotes
            ? getNotes(session.id).catch((err) =>
              isNotFoundError(err) ? null : Promise.reject(err),
            )
            : Promise.resolve(null),
          hasConcepts
            ? getConcepts(session.id).catch((err) =>
              isNotFoundError(err) ? null : Promise.reject(err),
            )
            : Promise.resolve(null),
        ]);

        if (!alive) return;

        setNotesData(notes);
        setConceptsData(concepts);
      } catch (err) {
        if (!alive) return;
        setError(getErrorMessage(err));
      } finally {
        if (alive) setLoadingExisting(false);
      }
    }

    loadExistingArtifacts();

    return () => {
      alive = false;
    };
  }, [session?.id, hasNotes, hasConcepts]);

  const canGenerate = Boolean(session?.id);

  const handleGenerateNotes = async () => {
    if (!session?.id) return;

    setGeneratingNotes(true);
    setError(null);
    try {
      const notes = await generateNotes(session.id);
      setNotesData(notes);
      onGenerated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleGenerateConcepts = async () => {
    if (!session?.id) return;

    setGeneratingConcepts(true);
    setError(null);
    try {
      const concepts = await generateConcepts(session.id);
      setConceptsData(concepts);
      onGenerated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingConcepts(false);
    }
  };

  const content = useMemo(() => {
    if (loadingExisting && !notesData && !conceptsData) {
      return (
        <div className="notes-content">
          <LoadingSpinner label="Loading notes…" />
        </div>
      );
    }

    if (!notesData) {
      return (
        <div className="notes-content">
          <div style={panelStyle}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No notes yet</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              Generate notes from the current session sources when you are ready.
            </div>
          </div>

          {conceptsData ? (
            <div>
              {conceptsData.concepts?.map((concept, i) => (
                <div key={i} className="concept-expand">
                  <button
                    className={`concept-trigger${openConcept === i ? ' open' : ''}`}
                    onClick={() => setOpenConcept(openConcept === i ? null : i)}
                    type="button"
                  >
                    <span>{concept.term}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className={`concept-body${openConcept === i ? ' open' : ''}`}>
                    {concept.explanation}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="notes-content">
        {notesData.sections?.map((note, i) => (
          <React.Fragment key={i}>
            <h3>{note.heading}</h3>
            <p>
              {note.body} <span className="notes-cite">{note.cite}</span>
            </p>
            {conceptsData?.concepts[i] && (
              <div className="concept-expand">
                <button
                  className={`concept-trigger${openConcept === i ? ' open' : ''}`}
                  onClick={() => setOpenConcept(openConcept === i ? null : i)}
                  type="button"
                >
                  <span>Simplify: {conceptsData.concepts[i].term}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className={`concept-body${openConcept === i ? ' open' : ''}`}>
                  {conceptsData.concepts[i].explanation}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }, [loadingExisting, notesData, conceptsData, openConcept]);

  if (!session?.id) {
    return <div className="notes-content">Select a session to view notes.</div>;
  }

  return (
    <div>
      <div style={toolbarStyle}>
        <button
          type="button"
          style={buttonStyle}
          onClick={handleGenerateNotes}
          disabled={!canGenerate || generatingNotes}
          title={hasNotes ? 'Regenerate notes' : 'Generate notes'}
        >
          {generatingNotes ? 'Generating notes…' : hasNotes ? 'Regenerate notes' : 'Generate notes'}
        </button>

        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={handleGenerateConcepts}
          disabled={!canGenerate || generatingConcepts}
          title={hasConcepts ? 'Regenerate concepts' : 'Generate concepts'}
        >
          {generatingConcepts
            ? 'Generating concepts…'
            : hasConcepts
              ? 'Regenerate concepts'
              : 'Generate concepts'}
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {content}
    </div>
  );
}
