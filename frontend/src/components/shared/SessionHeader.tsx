import React from 'react';
import { SessionDetail } from '../../services/endpoints/sessions';
import { SourceTypeIcon } from '../ui/Icons';

export function SessionHeader({ session }: { session: SessionDetail }) {
  return (
    <div className="sess-head">
      <h2>{session.title}</h2>
      <div className="sess-crumb">Fused from {session.sources.length} sources</div>
      <div className="sess-src-row">
        {session.sources.map((src, i) => (
          <span key={i} className="src-tag"><SourceTypeIcon type={src.type as any} size={14}/>{src.name}</span>
        ))}
      </div>
    </div>
  );
}
