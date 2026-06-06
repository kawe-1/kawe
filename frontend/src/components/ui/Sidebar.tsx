import React from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setActiveSession, setActiveTab, setShowCreateModal } from '../../features/sessions/sessionsSlice';
import { setSidebarOpen, toggleDarkMode } from '../../features/ui/uiSlice';
import { SparkIcon, TabIcon, TAB_LABELS } from './Icons';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { sessions, activeSessionId, activeTab } = useAppSelector(state => state.sessions);
  const { layout, sidebarOpen, darkMode } = useAppSelector(state => state.ui);
  const { profile } = useAppSelector(state => state.auth);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const showTabs = layout === 'sidebar' && activeSession;

  const onGoHome = () => {
    dispatch(setActiveSession(null));
    dispatch(setSidebarOpen(false));
    navigate('/dashboard');
  };

  const onNewSession = () => {
    dispatch(setShowCreateModal(true));
  };

  const onSelectSession = (s: any) => {
    dispatch(setActiveSession(s.id));
    dispatch(setSidebarOpen(false));
    navigate(`/session/${s.id}`);
  };

  const onSelectTab = (t: string) => {
    dispatch(setActiveTab(t));
    dispatch(setSidebarOpen(false));
  };

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
      <div className="sb-head">
        <button className="sb-logo" onClick={onGoHome} style={{ background:'none', border:'none', cursor:'pointer' }}>
          <SparkIcon size={24}/><span style={{letterSpacing:'.01em'}}>kaw<span className="e">e</span></span>
        </button>
      </div>

      <button className="sb-new" onClick={onNewSession}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        New session
      </button>

      <div className="sb-section">Your sessions</div>
      <div className="sb-items">
        {sessions.map(s => (
          <button key={s.id} className={`sb-item${activeSession?.id === s.id ? ' active' : ''}`}
                  onClick={() => onSelectSession(s)}>
            <span className="sb-dot" style={{ background: s.color }}></span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
          </button>
        ))}
      </div>

      {showTabs && (
        <React.Fragment>
          <div className="sb-section">Views</div>
          <div className="sb-tabs">
            {Object.keys(TAB_LABELS).map(t => (
              <button key={t} className={`sb-tab${activeTab === t ? ' active' : ''}`}
                      onClick={() => onSelectTab(t)}>
                <TabIcon tab={t}/> {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </React.Fragment>
      )}

      <div className="sb-foot">
        <button className="sb-foot-btn" onClick={() => {}}>
          <div className="sb-avatar-sm">
            {profile?.avatar
              ? <img src={profile.avatar} alt=""/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
            }
          </div>
          <span className="sb-profile-name">{profile?.name || 'Profile'}</span>
        </button>
        <button className="sb-foot-btn" onClick={() => {}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 13 19.49a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </button>
        <button className="sb-foot-btn" onClick={() => dispatch(toggleDarkMode())}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {darkMode
              ? <React.Fragment><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></React.Fragment>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
            }
          </svg>
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>
    </aside>
  );
}

export function MobileBurger({ onClick }: { onClick: () => void }) {
  return (
    <button className="sb-burger" onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16"/>
      </svg>
    </button>
  );
}
