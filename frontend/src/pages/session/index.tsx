import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { setActiveSession, setActiveTab, fetchSessionDetail, fetchSessions } from '../../features/sessions/sessionsSlice';
import { SessionHeader } from '../../components/shared/SessionHeader';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { NotesView } from '../../features/notes/components/NotesView';
import { QuizView } from '../../features/quizzes/components/QuizView';
import { FlashcardsView } from '../../features/flashcards/components/FlashcardsView';
import { ChatView } from '../../features/chat/components/ChatView';
import { SourcesView } from '../../features/uploads/components/SourcesView';
import { TAB_LABELS } from '../../components/ui/Icons';

export default function SessionPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { activeSessionId, activeSessionDetail, detailStatus, activeTab, sessions } = useAppSelector(state => state.sessions);
  const { layout } = useAppSelector(state => state.ui);

  useEffect(() => {
    if (id) {
      dispatch(setActiveSession(id));
      dispatch(fetchSessionDetail(id));
    }
    if (id && sessions.length === 0) {
      dispatch(fetchSessions());
    }
  }, [id, dispatch]);

  if (detailStatus === 'loading' || !activeSessionDetail) {
    return (
      <div className="main-pad">
        <LoadingSpinner label="Loading session…" />
      </div>
    );
  }

  const session = activeSessionDetail;

  // Render logic based on layout mode
  if (layout === 'split') {
    return (
      <div className="main-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SessionHeader session={session} />
        <div className="top-tabs">
          {['notes', 'quiz', 'flashcards', 'sources'].map(tab => (
            <button key={tab} className={`top-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => dispatch(setActiveTab(tab))}>{TAB_LABELS[tab]}</button>
          ))}
        </div>
        <div className="split-wrap" style={{ flex: 1, minHeight: 0 }}>
          <div className="split-left">
            {activeTab === 'notes' && <NotesView session={session} />}
            {activeTab === 'quiz' && <QuizView session={session} />}
            {activeTab === 'flashcards' && <FlashcardsView session={session} />}
            {activeTab === 'sources' && <SourcesView session={session} onUpload={() => { dispatch(fetchSessionDetail(session.id)); dispatch(fetchSessions()); }} />}
          </div>
          <div className="split-right">
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 14 }}>Ask Kawe</div>
            <ChatView session={session} />
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'top') {
    return (
      <div className="main-pad">
        <SessionHeader session={session} />
        <div className="top-tabs">
          {Object.keys(TAB_LABELS).map(tab => (
            <button key={tab} className={`top-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => dispatch(setActiveTab(tab))}>{TAB_LABELS[tab]}</button>
          ))}
        </div>
        {activeTab === 'notes' && <NotesView session={session} />}
        {activeTab === 'quiz' && <QuizView session={session} />}
        {activeTab === 'flashcards' && <FlashcardsView session={session} />}
        {activeTab === 'chat' && <ChatView session={session} />}
        {activeTab === 'sources' && <SourcesView session={session} onUpload={() => { dispatch(fetchSessionDetail(session.id)); dispatch(fetchSessions()); }} />}
      </div>
    );
  }

  return (
    <div className="main-pad">
      <SessionHeader session={session} />
      {activeTab === 'notes' && <NotesView session={session} />}
      {activeTab === 'quiz' && <QuizView session={session} />}
      {activeTab === 'flashcards' && <FlashcardsView session={session} />}
      {activeTab === 'chat' && <ChatView session={session} />}
      {activeTab === 'sources' && <SourcesView session={session} onUpload={() => { dispatch(fetchSessionDetail(session.id)); dispatch(fetchSessions()); }} />}
    </div>
  );
}
