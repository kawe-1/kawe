import React, { useState } from 'react';
interface CreateModalProps {
  onClose: () => void;
  onCreate: (title: string) => void;
}

export function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [name, setName] = useState('');
  
  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>New Topic Session</h2>
        <p>Give your session a name. You can upload sources after.</p>
        <div className="modal-field">
          <label>Session name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Biology Week 4"
                 onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus/>
        </div>
        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
