import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setAuthStatus, updateProfile, setActiveWorkspace } from '../../features/auth/authSlice';
import { SparkIcon } from '../../components/ui/Icons';
import { createGroup, joinGroup, joinCourse, updateUserProfile } from '../../services/endpoints/groups';
import { ACADEMIC_LEVELS, ACADEMIC_FIELDS } from '../../constants/academics';
import type { AcademicLevel, GroupInfo, CourseInfo } from '../../types/user';

const WORKSPACE_CHOICES = [
  { id: 'individual', label: 'Individual', desc: 'Study solo at your own pace' },
  { id: 'study_group', label: 'Study Group', desc: 'Collaborate with peers on shared sessions' },
  { id: 'course_group', label: 'Course Group', desc: 'Join a structured course with a code' },
] as const;

type WorkspaceChoice = (typeof WORKSPACE_CHOICES)[number];

function WorkspaceIcon({ type }: { type: WorkspaceChoice['id'] }) {
  if (type === 'individual') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.8 3.6-7 8-7s8 3.2 8 7" />
    </svg>
  );
  if (type === 'study_group') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 20c0-3 2.7-5.5 6-5.5" />
      <circle cx="16" cy="7" r="3" />
      <path d="M22 20c0-3-2.7-5.5-6-5.5" />
      <path d="M12 15c3.3 0 6 2.5 6 5.5H6c0-3 2.7-5.5 6-5.5z" />
    </svg>
  );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile } = useAppSelector(state => state.auth);
  const userName = profile?.name || '';

  const [step, setStep] = useState(0);
  const [dName, setDName] = useState(userName);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceChoice['id']>('individual');
  const [level, setLevel] = useState<AcademicLevel | ''>('');
  const [field, setField] = useState('');
  const [institution, setInstitution] = useState('');
  const [groupMode, setGroupMode] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [groupResult, setGroupResult] = useState<GroupInfo | null>(null);
  const [courseResult, setCourseResult] = useState<CourseInfo | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);

  const isGroupUser = workspaceType === 'study_group' || workspaceType === 'course_group';
  const totalDots = isGroupUser ? 5 : 4;

  // Map internal step → visual dot index (step 3 only exists for group users)
  const dotIndex = (s: number) => {
    if (!isGroupUser && s >= 3) return s - 1;
    return s;
  };

  const LAST_STEP = isGroupUser ? 4 : 3;

  const canGo = (() => {
    if (step === 0) return dName.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return level !== '' && field !== '';
    if (step === 3) {
      if (workspaceType === 'course_group') return joinCode.trim().length > 0;
      return groupMode === 'create' ? groupName.trim().length > 0 : joinCode.trim().length > 0;
    }
    return true;
  })();

  const finish = (overrides?: { group?: GroupInfo | null; course?: CourseInfo | null }) => {
    const finalGroup = overrides?.group ?? groupResult;
    const finalCourse = overrides?.course ?? courseResult;

    const finalProfile = {
      ...profile,
      name: dName.trim() || userName,
      academicLevel: level,
      academicField: field,
      institution,
      group: finalGroup,
      course: finalCourse,
    };
    dispatch(updateProfile(finalProfile));
    if (finalGroup) dispatch(setActiveWorkspace(finalGroup.id));
    if (finalCourse) dispatch(setActiveWorkspace(finalCourse.id));
    dispatch(setAuthStatus('app'));

    updateUserProfile({
      name: finalProfile.name,
      academic_level: level,
      institution,
      group_id: finalGroup?.id ?? null,
      course_id: finalCourse?.id ?? null,
      has_onboarded: true,
    }).catch(() => { });

    navigate('/dashboard');
  };

  const handleGroupStep = async () => {
    setGroupError(null);
    setGroupLoading(true);
    try {
      if (workspaceType === 'course_group') {
        const course = await joinCourse(joinCode.trim().toUpperCase());
        setCourseResult(course);
        setStep(s => s + 1);
      } else if (groupMode === 'create') {
        const group = await createGroup(groupName.trim());
        setGroupResult({ ...group, role: 'admin' });
        setStep(s => s + 1);
      } else {
        const group = await joinGroup(joinCode.trim().toUpperCase());
        setGroupResult({ ...group, role: 'member' });
        setStep(s => s + 1);
      }
    } catch (e: any) {
      setGroupError(e?.message || 'Something went wrong. Check the code and try again.');
    } finally {
      setGroupLoading(false);
    }
  };

  const next = () => {
    if (step === 3 && isGroupUser) { handleGroupStep(); return; }
    if (step === LAST_STEP) { finish(); return; }
    // Skip step 3 for individual users
    if (step === 2 && !isGroupUser) { setStep(LAST_STEP); return; }
    setStep(s => s + 1);
  };

  const renderStep = () => {
    // ── Step 0: Name ────────────────────────────────────────────────────────────
    if (step === 0) return (
      <div className="onboard-step" key="s0">
        <div className="auth-spark" style={{ marginBottom: 20 }}><SparkIcon size={52} /></div>
        <h1>Welcome to Kawe{dName ? `, ${dName}` : ''}!</h1>
        <p className="ob-sub">Let's personalise your study companion. What should we call you?</p>
        <input className="ob-input" value={dName} onChange={e => setDName(e.target.value)}
          placeholder="Your name" autoFocus onKeyDown={e => { if (e.key === 'Enter' && canGo) next(); }} />
        <button className="ob-btn" disabled={!canGo} onClick={next}>Continue</button>
      </div>
    );

    // ── Step 1: Workspace choice ──────────────────────────────────────────────────
    if (step === 1) return (
      <div className="onboard-step" key="s1">
        <h1>How are you studying?</h1>
        <p className="ob-sub">Choose the setup that fits how you learn. You can add more later from the sidebar.</p>
        <div className="ob-account-types">
          {WORKSPACE_CHOICES.map(({ id, label, desc }) => (
            <button
              key={id}
              className={`ob-account-card${workspaceType === id ? ' selected' : ''}`}
              onClick={() => setWorkspaceType(id)}
            >
              <div className="ob-account-icon"><WorkspaceIcon type={id} /></div>
              <span className="ob-account-label">{label}</span>
              <span className="ob-account-desc">{desc}</span>
            </button>
          ))}
        </div>
        <button className="ob-btn" onClick={next}>Continue</button>
      </div>
    );

    // ── Step 2: Academic profile ─────────────────────────────────────────────────
    if (step === 2) return (
      <div className="onboard-step" key="s2">
        <h1>Your academic profile</h1>
        <p className="ob-sub">What class are you in? This helps us tailor your experience.</p>

        <p className="ob-field-label">Academic level</p>
        <div className="ob-chips" style={{ marginBottom: 20 }}>
          {ACADEMIC_LEVELS.map(l => (
            <button key={l.id} className={`ob-chip${level === l.id ? ' selected' : ''}`}
              onClick={() => { setLevel(l.id); setField(''); }}>
              {l.label}
            </button>
          ))}
        </div>

        {level !== '' && (
          <>
            <p className="ob-field-label">Field of study</p>
            <div className="ob-chips" style={{ marginBottom: 20 }}>
              {ACADEMIC_FIELDS[level].map(f => (
                <button key={f} className={`ob-chip${field === f ? ' selected' : ''}`}
                  onClick={() => setField(f)}>
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="ob-field-label">Institution <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optional)</span></p>
        <input className="ob-input" style={{ width: '100%', boxSizing: 'border-box' }}
          value={institution} onChange={e => setInstitution(e.target.value)}
          placeholder="e.g. University of Lagos" />

        <button className="ob-btn" disabled={!canGo} onClick={next}>Continue</button>
      </div>
    );

    // ── Step 3: Group setup (group users only) ───────────────────────────────────
    if (step === 3 && isGroupUser) return (
      <div className="onboard-step" key="s3">
        <h1>{workspaceType === 'course_group' ? 'Join your class' : 'Set up your group'}</h1>
        <p className="ob-sub">
          {workspaceType === 'course_group'
            ? 'Enter the code your instructor shared with you.'
            : 'Create a new group or join one with a code.'}
        </p>

        {workspaceType === 'study_group' && (
          <div className="ob-group-tabs">
            <button className={`ob-group-tab${groupMode === 'create' ? ' active' : ''}`}
              onClick={() => { setGroupMode('create'); setJoinCode(''); setGroupError(null); }}>
              Create a group
            </button>
            <button className={`ob-group-tab${groupMode === 'join' ? ' active' : ''}`}
              onClick={() => { setGroupMode('join'); setGroupName(''); setGroupError(null); }}>
              Join with a code
            </button>
          </div>
        )}

        {workspaceType === 'study_group' && groupMode === 'create' && (
          <input className="ob-input" style={{ width: '100%', boxSizing: 'border-box' }}
            value={groupName} onChange={e => setGroupName(e.target.value)}
            placeholder="Group name (e.g. Biology Study Squad)" autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && canGo) next(); }} />
        )}

        {(workspaceType === 'course_group' || groupMode === 'join') && (
          <input className="ob-input" style={{ width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }}
            value={joinCode} onChange={e => setJoinCode(e.target.value)}
            placeholder={workspaceType === 'course_group' ? 'Class code (e.g. BIO-2024)' : 'Group code (e.g. KW-XXXX)'}
            autoFocus onKeyDown={e => { if (e.key === 'Enter' && canGo) next(); }} />
        )}

        {groupError && (
          <div style={{ background: 'color-mix(in srgb,var(--coral) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--coral) 30%,transparent)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--coral)', textAlign: 'center' }}>
            {groupError}
          </div>
        )}

        <button className="ob-btn" disabled={!canGo || groupLoading} onClick={next}>
          {groupLoading ? 'Please wait…' : workspaceType === 'study_group' && groupMode === 'create' ? 'Create group' : 'Join'}
        </button>
      </div>
    );

    // ── Done ────────────────────────────────────────────────────────────────────
    return (
      <div className="onboard-step" key="s-done">
        <div className="ob-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1>You're all set, {dName || 'friend'}!</h1>
        <p className="ob-sub">Upload your materials and let Kawe fuse everything into one clear study experience.</p>

        {groupResult && (
          <div className="ob-code-callout">
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>
              Your group code
            </p>
            <p className="group-code-val">{groupResult.code}</p>
            <p style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4 }}>Share this with your study partners.</p>
          </div>
        )}

        {courseResult && (
          <div className="ob-code-callout" style={{ borderColor: 'var(--marigold)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 4 }}>
              Enrolled in
            </p>
            <p className="ob-account-label" style={{ fontSize: 15 }}>{courseResult.name}</p>
            <p style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 2 }}>{courseResult.instructor}</p>
          </div>
        )}

        {(groupResult || courseResult) && (
          <p className="ob-sub" style={{ fontSize: 13 }}>
            You can switch between {workspaceType === 'study_group' ? 'this group' : 'this class'} and studying solo anytime from the sidebar.
          </p>
        )}

        <button className="ob-btn" onClick={() => finish()}>Start studying</button>
      </div>
    );
  };

  return (
    <div className="onboard-page">
      <div className="onboard-top">
        <div className="onboard-dots">
          {Array.from({ length: totalDots }, (_, i) => {
            const di = dotIndex(step);
            return <div key={i} className={`onboard-dot${i === di ? ' active' : i < di ? ' done' : ''}`} />;
          })}
        </div>
        {step < LAST_STEP && <button className="onboard-skip" onClick={() => finish()}>Skip</button>}
      </div>
      <div className="onboard-body">{renderStep()}</div>
    </div>
  );
}
