import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { SparkIcon } from '../../components/ui/Icons';
import { setShowCreateModal, setActiveSession, fetchSessions, createNewSession } from '../../features/sessions/sessionsSlice';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sessions, status } = useAppSelector(state => state.sessions);
  const { profile } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSessions());
    }
  }, [status, dispatch]);

  const handleSelectSession = (s: any) => {
    dispatch(setActiveSession(s.id));
    navigate(`/session/${s.id}`);
  };

  const handleCreate = (title: string) => {
    dispatch(createNewSession(title));
    dispatch(setShowCreateModal(false));
  };

  return (
    <div className="main-pad">
      <div className="dash-welcome">
        <h1>Welcome back{profile?.name ? `, ${profile.name}` : ''}</h1>
        <p>Pick a session to continue, or start a new one.</p>
      </div>
      {sessions.length === 0 ? (
        <div className="dash-empty">
          <SparkIcon size={80} style={{ opacity: 0.4 }}/>
          <h3>No sessions yet</h3>
          <p>Create your first topic session to get started.</p>
          <button className="q-btn q-btn-primary" style={{ marginTop: 16 }} onClick={() => dispatch(setShowCreateModal(true))}>Create session</button>
        </div>
      ) : (
        <div className="dash-grid">
          {sessions.map(s => (
            <div key={s.id} className="dash-card" onClick={() => handleSelectSession(s)}>
              <div style={{ width: 32, height: 4, borderRadius: 2, background: '#F4A12B', marginBottom: 14 }}></div>
              <h3>{s.title}</h3>
            </div>
          ))}
          <div className="dash-card" onClick={() => dispatch(setShowCreateModal(true))}
               style={{ display: 'grid', placeItems: 'center', borderStyle: 'dashed', minHeight: 180 }}>
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginBottom: 8 }}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <div style={{ fontWeight: 600, fontSize: 14 }}>New session</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
