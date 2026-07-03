import React, { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { addWorkspace } from '../../features/auth/authSlice';
import { createGroup, joinGroup, joinCourse } from '../../services/endpoints/groups';
import type { Workspace } from '../../types/user';

type Tab = 'create_group' | 'join_group' | 'join_course';

interface AddWorkspaceModalProps {
  onClose: () => void;
}

export function AddWorkspaceModal({ onClose }: AddWorkspaceModalProps) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('create_group');
  const [groupName, setGroupName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = tab === 'create_group' ? groupName.trim().length > 0 : code.trim().length > 0;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      let workspace: Workspace;
      if (tab === 'create_group') {
        const group = await createGroup(groupName.trim());
        workspace = { id: group.id, type: 'study_group', label: group.name, group: { ...group, role: 'admin' } };
      } else if (tab === 'join_group') {
        const group = await joinGroup(code.trim().toUpperCase());
        workspace = { id: group.id, type: 'study_group', label: group.name, group: { ...group, role: 'member' } };
      } else {
        const course = await joinCourse(code.trim().toUpperCase());
        workspace = { id: course.id, type: 'course_group', label: course.name, course };
      }
      dispatch(addWorkspace(workspace));
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add a study space</h2>
        <p>Create a group, join one with a code, or join a class.</p>

        <div className="ob-group-tabs" style={{ marginTop: 16 }}>
          <button className={`ob-group-tab${tab === 'create_group' ? ' active' : ''}`}
                  onClick={() => { setTab('create_group'); setError(null); }}>
            Create group
          </button>
          <button className={`ob-group-tab${tab === 'join_group' ? ' active' : ''}`}
                  onClick={() => { setTab('join_group'); setError(null); }}>
            Join group
          </button>
          <button className={`ob-group-tab${tab === 'join_course' ? ' active' : ''}`}
                  onClick={() => { setTab('join_course'); setError(null); }}>
            Join class
          </button>
        </div>

        <div className="modal-field">
          <label>{tab === 'create_group' ? 'Group name' : tab === 'join_group' ? 'Group code' : 'Class code'}</label>
          {tab === 'create_group' ? (
            <input value={groupName} onChange={e => setGroupName(e.target.value)}
                   placeholder="e.g. Biology Study Squad" autoFocus
                   onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}/>
          ) : (
            <input value={code} onChange={e => setCode(e.target.value)}
                   placeholder={tab === 'join_group' ? 'e.g. KW-XXXX' : 'e.g. BIO-2024'} autoFocus
                   style={{ textTransform: 'uppercase' }}
                   onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}/>
          )}
        </div>

        {error && (
          <div style={{ background: 'color-mix(in srgb,var(--coral) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--coral) 30%,transparent)', borderRadius: 10, padding: '10px 14px', marginBottom: 4, fontSize: 13, color: 'var(--coral)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" disabled={!canSubmit || loading} onClick={handleSubmit}>
            {loading ? 'Please wait…' : tab === 'create_group' ? 'Create' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
