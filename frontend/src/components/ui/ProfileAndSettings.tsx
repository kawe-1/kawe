import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateProfile, logout } from '../../features/auth/authSlice';
import { setLayout, toggleDarkMode } from '../../features/ui/uiSlice';
import { updateUserProfile } from '../../services/endpoints/groups';
const OB_SUBJECTS = [
  'Biology', 'Chemistry', 'Physics', 'Psychology', 'Computer Science',
  'Mathematics', 'History', 'Literature', 'Economics', 'Engineering', 'Medicine', 'Law',
];
const OB_LEVELS = ['High School', 'Undergraduate', 'Postgraduate', 'Professional'];



// ── PROFILE VIEW ──────────────────────────────────────────────────────────────

export function ProfileView() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.auth);

  const [name, setName] = React.useState(profile.name || '');
  const [bio, setBio] = React.useState(profile.bio || '');
  const [subs, setSubs] = React.useState<string[]>(profile.subjectArea ?? []);
  const [level, setLevel] = React.useState(profile.academicLevel || '');
  const [institution, setInstitution] = React.useState(profile.institution || '');
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const toggleSub = (s: string) =>
    setSubs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        subject_area: subs,
        academic_level: level,
        institution: institution.trim(),
      });
      dispatch(updateProfile({
        name: name.trim(),
        bio,
        subjectArea: subs,
        subjects: subs,
        academicLevel: level,
        institution: institution.trim(),
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // surface error if needed
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => dispatch(updateProfile({ avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="main-pad">
      <h2 style={{ marginBottom: 24 }}>Your Profile</h2>
      <div className="profile-wrap">

        {/* ── Avatar ── */}
        <div className="profile-avatar-row">
          <div className="profile-avatar" onClick={() => fileRef.current?.click()}>
            {profile.avatar
              ? <img src={profile.avatar} alt="" />
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            }
            <div className="avatar-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--display)' }}>{profile.name || 'Student'}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Click photo to upload a picture</div>
          </div>
        </div>

        {/* ── Name ── */}
        <div className="profile-field">
          <label>Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>

        {/* ── Bio ── */}
        <div className="profile-field">
          <label>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself…" />
        </div>

        {/* ── Academic level ── */}
        <div className="profile-field">
          <label>Academic Level</label>
          <div className="ob-chips" style={{ marginTop: 6 }}>
            {OB_LEVELS.map(l => (
              <button
                key={l}
                className={`ob-chip${level === l ? ' selected' : ''}`}
                onClick={() => setLevel(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Institution ── */}
        <div className="profile-field">
          <label>
            Institution{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>
              (optional)
            </span>
          </label>
          <input
            value={institution}
            onChange={e => setInstitution(e.target.value)}
            placeholder="e.g. University of Lagos"
          />
        </div>

        {/* ── Subject areas ── */}
        <div className="profile-field">
          <label>Subject Areas</label>
          <div className="ob-chips" style={{ marginTop: 6 }}>
            {OB_SUBJECTS.map(s => (
              <button
                key={s}
                className={`ob-chip${subs.includes(s) ? ' selected' : ''}`}
                onClick={() => toggleSub(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <button className="q-btn q-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
}


// ── SETTINGS VIEW ─────────────────────────────────────────────────────────────

export function SettingsView() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.auth);
  const { layout, darkMode } = useAppSelector(state => state.ui);

  const layoutInfo = [
    {
      key: 'sidebar', label: 'Sidebar', desc: 'Views in the left panel',
      icon: <svg viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="46" height="34" rx="4" /><line x1="16" y1="1" x2="16" y2="35" /><line x1="3" y1="11" x2="14" y2="11" /><line x1="3" y1="17" x2="14" y2="17" /><line x1="3" y1="23" x2="14" y2="23" /></svg>,
    },
    {
      key: 'top', label: 'Top Tabs', desc: 'Views above the content',
      icon: <svg viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="46" height="34" rx="4" /><line x1="1" y1="11" x2="47" y2="11" /><rect x="6" y="4" width="10" height="5" rx="2" fill="currentColor" opacity=".3" /><rect x="19" y="4" width="10" height="5" rx="2" /></svg>,
    },
    {
      key: 'split', label: 'Split', desc: 'Content + chat side by side',
      icon: <svg viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="46" height="34" rx="4" /><line x1="28" y1="1" x2="28" y2="35" /></svg>,
    },
  ];

  const handleLogout = () => dispatch(logout());

  return (
    <div className="main-pad">
      <h2 style={{ marginBottom: 24 }}>Settings</h2>
      <div className="settings-wrap">

        {/* ── Workspace layout ── */}
        <div className="settings-section">
          <h3>Workspace Layout</h3>
          <p className="settings-desc">Choose how the session workspace is organized.</p>
          <div className="layout-options">
            {layoutInfo.map(l => (
              <div
                key={l.key}
                className={`layout-opt${layout === l.key ? ' active' : ''}`}
                onClick={() => dispatch(setLayout(l.key as any))}
              >
                {l.icon}<h4>{l.label}</h4><p>{l.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Account type & group/course ── */}
        <div className="settings-section">
          <h3>Account</h3>
          <p className="settings-desc">Your account type and group membership.</p>

          {profile.groups.map(group => (
            <div className="setting-row" key={group.id}>
              <div>
                <div className="setting-label">{group.name}</div>
                <div className="setting-hint">
                  {group.role === 'owner' ? 'Group owner' : group.role === 'admin' ? 'Group admin' : 'Member'}
                  {' · '}
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.08em',
                color: 'var(--marigold)',
                background: 'color-mix(in srgb, var(--marigold) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--marigold) 25%, transparent)',
                borderRadius: 8,
                padding: '4px 10px',
              }}>
                {group.code}
              </div>
            </div>
          ))}

          {profile.courses.map(course => (
            <div className="setting-row" key={course.id}>
              <div>
                <div className="setting-label">{course.name}</div>
                <div className="setting-hint">
                  {course.instructor}
                  {' · '}
                  {course.memberCount} enrolled
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.08em',
                color: 'var(--marigold)',
                background: 'color-mix(in srgb, var(--marigold) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--marigold) 25%, transparent)',
                borderRadius: 8,
                padding: '4px 10px',
              }}>
                {course.code}
              </div>
            </div>
          ))}
        </div>

        {/* ── Appearance ── */}
        <div className="settings-section">
          <h3>Appearance</h3>
          <p className="settings-desc">Customise how Kawe looks.</p>
          <div className="setting-row">
            <div>
              <div className="setting-label">Dark mode</div>
              <div className="setting-hint">Easier on the eyes at night</div>
            </div>
            <button className={`toggle-track${darkMode ? ' on' : ''}`} onClick={() => dispatch(toggleDarkMode())}>
              <div className="toggle-knob" />
            </button>
          </div>
        </div>

        {/* ── Sign out ── */}
        <div className="settings-section">
          <h3>Session</h3>
          <p className="settings-desc">Manage your sign-in session.</p>
          <div className="setting-row">
            <div>
              <div className="setting-label">Sign out</div>
              <div className="setting-hint">You'll be returned to the sign-in screen</div>
            </div>
            <button
              onClick={handleLogout}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 999, background: 'transparent', border: '1.5px solid var(--sand)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--clay)', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clay)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--clay) 8%, transparent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sand)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
                <path d="M13 15l4-5-4-5" /><path d="M17 10H7" /><path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" />
              </svg>
              Sign out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
