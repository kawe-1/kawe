import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { SparkIcon } from '../../components/ui/Icons';
import { setShowCreateModal, setActiveSession, fetchSessions, createNewSession } from '../../features/sessions/sessionsSlice';
import { useNavigate } from 'react-router-dom';
import type { Workspace } from '../../types/user';
import { getSessionWorkspace } from '../../utils/workspaceSessions';

// ── Group / class banner ──────────────────────────────────────────────────────

function WorkspaceBanner({ workspace }: { workspace: Workspace }) {
  const { type, group, course } = workspace;
  const [copied, setCopied] = React.useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (type === 'study_group' && group) {
    return (
      <div className="group-banner group-banner--study">
        <div className="group-banner-left">
          <div className="group-banner-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8" cy="7" r="3"/>
              <path d="M2 20c0-3 2.7-5.5 6-5.5"/>
              <circle cx="16" cy="7" r="3"/>
              <path d="M22 20c0-3-2.7-5.5-6-5.5"/>
              <path d="M12 15c3.3 0 6 2.5 6 5.5H6c0-3 2.7-5.5 6-5.5z"/>
            </svg>
          </div>
          <div>
            <p className="group-banner-name">{group.name}</p>
            <p className="group-banner-sub">
              {group.role === 'admin' ? 'Group admin' : 'Member'} · {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        <div className="group-banner-right">
          <p className="group-banner-label">SHARE CODE</p>
          <button className="group-code-val" onClick={() => copyCode(group.code)}
                  title="Click to copy" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {copied ? 'Copied!' : group.code}
          </button>
        </div>
      </div>
    );
  }

  if (type === 'course_group' && course) {
    return (
      <div className="group-banner group-banner--course">
        <div className="group-banner-left">
          <div className="group-banner-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div>
            <p className="group-banner-name">{course.name}</p>
            <p className="group-banner-sub">{course.instructor} · {course.memberCount} enrolled</p>
          </div>
        </div>
        <div className="group-banner-right">
          <p className="group-banner-label">CLASS CODE</p>
          <p className="group-code-val" style={{ color: 'var(--marigold)' }}>{course.code}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Dashboard page ────────────────────────────────────────────────────────────

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

  const activeWorkspaceId = profile?.activeWorkspaceId || 'individual';
  const activeWorkspace = (profile?.workspaces || []).find(w => w.id === activeWorkspaceId);
  const visibleSessions = sessions.filter(s => getSessionWorkspace(s.id) === activeWorkspaceId);

  const handleSelectSession = (s: any) => {
    dispatch(setActiveSession(s.id));
    navigate(`/session/${s.id}`);
  };

  const handleNewSession = () => {
    dispatch(setShowCreateModal(true));
  };

  return (
    <div className="main-pad">
      <div className="dash-welcome">
        <h1>Welcome back{profile?.name ? `, ${profile.name}` : ''}</h1>
        <p>
          {activeWorkspace && activeWorkspace.id !== 'individual'
            ? `Pick up where you left off in ${activeWorkspace.label}, or start a new session.`
            : 'Pick a session to continue, or start a new one.'}
        </p>
      </div>

      {activeWorkspace && <WorkspaceBanner workspace={activeWorkspace}/>}

      {visibleSessions.length === 0 ? (
        <div className="dash-empty">
          <SparkIcon size={80} style={{ opacity: 0.4 }}/>
          <h3>No sessions yet</h3>
          <p>
            {activeWorkspace && activeWorkspace.id !== 'individual'
              ? `Create your first topic session in ${activeWorkspace.label}.`
              : 'Create your first topic session to get started.'}
          </p>
          <button className="q-btn q-btn-primary" style={{ marginTop: 16 }} onClick={handleNewSession}>Create session</button>
        </div>
      ) : (
        <div className="dash-grid">
          {visibleSessions.map(s => (
            <div key={s.id} className="dash-card" onClick={() => handleSelectSession(s)}>
              <div style={{ width: 32, height: 4, borderRadius: 2, background: '#F4A12B', marginBottom: 14 }}></div>
              <h3>{s.title}</h3>
            </div>
          ))}
          <div className="dash-card" onClick={handleNewSession}
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
