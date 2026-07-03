import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setActiveSession, setActiveTab, setShowCreateModal } from '../../features/sessions/sessionsSlice';
import { setSidebarOpen, toggleDarkMode, setShowAddWorkspaceModal } from '../../features/ui/uiSlice';
import { setActiveWorkspace } from '../../features/auth/authSlice';
import { SparkIcon, TabIcon, TAB_LABELS } from './Icons';
import { useNavigate } from 'react-router-dom';
import { ProfileView, SettingsView } from './ProfileAndSettings';

type SidePanel = 'profile' | 'settings' | null;

// ── Full-screen overlay panel ─────────────────────────────────────────────────

function FullPanel({
  panel,
  onClose,
}: {
  panel: Exclude<SidePanel, null>;
  onClose: () => void;
}) {
  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'panelIn .18s ease',
      }}
    >
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--line)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          color: 'var(--muted)',
        }}>
          {panel === 'profile' ? 'Profile' : 'Settings'}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
            borderRadius: 8,
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg2)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--muted)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {panel === 'profile' ? <ProfileView /> : <SettingsView />}
      </div>

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
import { getSessionWorkspace } from '../../utils/workspaceSessions';

function WorkspaceIcon({ type }: { type: string }) {
  if (type === 'study_group') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="7" r="3" /><path d="M2 20c0-3 2.7-5.5 6-5.5" /><circle cx="16" cy="7" r="3" /><path d="M22 20c0-3-2.7-5.5-6-5.5" /><path d="M12 15c3.3 0 6 2.5 6 5.5H6c0-3 2.7-5.5 6-5.5z" />
    </svg>
  );
  if (type === 'course_group') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.8 3.6-7 8-7s8 3.2 8 7" />
    </svg>
  );
}

function WorkspaceSwitcher() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.auth);
  const [open, setOpen] = useState(false);

  const workspaces = profile?.workspaces || [];
  const activeId = profile?.activeWorkspaceId || 'individual';
  const active = workspaces.find(w => w.id === activeId) || workspaces[0];

  const handleSelect = (id: string) => {
    dispatch(setActiveWorkspace(id));
    setOpen(false);
  };

  const handleAdd = () => {
    setOpen(false);
    dispatch(setShowAddWorkspaceModal(true));
  };

  return (
    <div className="ws-switcher">
      <button className="ws-switcher-btn" onClick={() => setOpen(v => !v)}>
        <span className="ws-switcher-icon"><WorkspaceIcon type={active?.type || 'individual'} /></span>
        <span className="ws-switcher-label">{active?.label || 'Individual'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="ws-switcher-menu">
          {workspaces.map(w => (
            <button key={w.id} className={`ws-switcher-item${w.id === activeId ? ' active' : ''}`} onClick={() => handleSelect(w.id)}>
              <span className="ws-switcher-icon"><WorkspaceIcon type={w.type} /></span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.label}</span>
            </button>
          ))}
          <button className="ws-switcher-item ws-switcher-add" onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add group or class
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { sessions, activeSessionId, activeTab, activeSessionDetail } = useAppSelector(state => state.sessions);
  const { layout, sidebarOpen, darkMode } = useAppSelector(state => state.ui);
  const { profile } = useAppSelector(state => state.auth);

  const [sidePanel, setSidePanel] = React.useState<SidePanel>(null);

  const sessionFromList = sessions.find(s => s.id === activeSessionId);
  const activeSession = sessionFromList || (activeSessionDetail && activeSessionDetail.id === activeSessionId
    ? { id: activeSessionDetail.id, title: activeSessionDetail.title }
    : undefined);
  const showTabs = layout === 'sidebar' && activeSession;

  // Scope the session list to whichever workspace is active, same as the dashboard.
  const activeWorkspaceId = profile?.activeWorkspaceId || 'individual';
  const visibleSessions = sessions.filter(s => getSessionWorkspace(s.id) === activeWorkspaceId);

  const onGoHome = () => {
    dispatch(setActiveSession(null));
    dispatch(setSidebarOpen(false));
    setSidePanel(null);
    navigate('/dashboard');
  };

  const onSelectSession = (s: any) => {
    dispatch(setActiveSession(s.id));
    dispatch(setSidebarOpen(false));
    setSidePanel(null);
    navigate(`/session/${s.id}`);
  };

  const onSelectTab = (t: string) => {
    dispatch(setActiveTab(t));
    dispatch(setSidebarOpen(false));
  };

  const togglePanel = (panel: Exclude<SidePanel, null>) =>
    setSidePanel(prev => (prev === panel ? null : panel));

  return (
    <>
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sb-head">
          <button className="sb-logo" onClick={onGoHome} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <SparkIcon size={24} />
            <span style={{ letterSpacing: '.01em' }}>kaw<span className="e">e</span></span>
          </button>
        </div>

        <WorkspaceSwitcher />

        <button className="sb-new" onClick={() => dispatch(setShowCreateModal(true))}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New session
        </button>

        <div className="sb-section">Your sessions</div>
        <div className="sb-items">
          {visibleSessions.map(s => (
            <button key={s.id} className={`sb-item${activeSession?.id === s.id ? ' active' : ''}`}
              onClick={() => onSelectSession(s)}>
              {/* <span className="sb-dot" style={{ background: s.color }}></span> */}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
            </button>
          ))}
        </div>

        {showTabs && (
          <React.Fragment>
            <div className="sb-section">Views</div>
            <div className="sb-tabs">
              {Object.keys(TAB_LABELS).map(t => (
                <button
                  key={t}
                  className={`sb-tab${activeTab === t ? ' active' : ''}`}
                  onClick={() => onSelectTab(t)}
                >
                  <TabIcon tab={t} /> {TAB_LABELS[t]}
                </button>
              ))}
            </div>
          </React.Fragment>
        )}

        <div className="sb-foot">
          <button
            className={`sb-foot-btn${sidePanel === 'profile' ? ' active' : ''}`}
            onClick={() => togglePanel('profile')}
          >
            <div className="sb-avatar-sm">
              {profile?.avatar
                ? <img src={profile.avatar} alt="" />
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              }
            </div>
            <span className="sb-profile-name">{profile?.name || 'Profile'}</span>
          </button>

          <button
            className={`sb-foot-btn${sidePanel === 'settings' ? ' active' : ''}`}
            onClick={() => togglePanel('settings')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 13 19.49a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>

          <button className="sb-foot-btn" onClick={() => dispatch(toggleDarkMode())}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {darkMode
                ? <React.Fragment>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </React.Fragment>
                : <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
              }
            </svg>
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </aside>

      {sidePanel && <FullPanel panel={sidePanel} onClose={() => setSidePanel(null)} />}
    </>
  );
}

export function MobileBurger({ onClick }: { onClick: () => void }) {
  return (
    <button className="sb-burger" onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}
