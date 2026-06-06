import React, { useState, useEffect } from 'react';
import { SessionDetail } from '../../../services/endpoints/sessions';
import { getNotes, getConcepts, Notes, Concepts } from '../../../services/endpoints/artifacts';

export function NotesView({ session }: { session?: SessionDetail | null }) {
  const [openConcept, setOpenConcept] = useState<number | null>(null);
  const [notesData, setNotesData] = useState<Notes | null>(null);
  const [conceptsData, setConceptsData] = useState<Concepts | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.id) {
      setLoading(true);
      Promise.all([
        getNotes(session.id).catch(() => null),
        getConcepts(session.id).catch(() => null)
      ]).then(([n, c]) => {
        if (n) setNotesData(n);
        if (c) setConceptsData(c);
        setLoading(false);
      });
    }
  }, [session?.id]);

  if (loading || !notesData) return <div className="notes-content">Loading notes...</div>;

  return (
    <div className="notes-content">
      {notesData.sections.map((n, i) => (
        <React.Fragment key={i}>
          <h3>{n.heading}</h3>
          <p>{n.body} <span className="notes-cite">{n.cite}</span></p>
          {conceptsData?.concepts[i] && (
            <div className="concept-expand">
              <button className={`concept-trigger${openConcept === i ? ' open' : ''}`}
                      onClick={() => setOpenConcept(openConcept === i ? null : i)}>
                <span>Simplify: {conceptsData.concepts[i].term}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
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
}
