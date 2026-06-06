import React from 'react';
import { SessionDetail } from '../../../services/endpoints/sessions';
import { SourceTypeIcon, SOURCE_ICONS } from '../../../components/ui/Icons';

export function SourcesView({ session }: { session: SessionDetail }) {
  return (
    <div>
      <div className="upload-zone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        <h4>Drop files here or click to upload</h4>
        <p>PDF, audio, images, or paste a YouTube URL</p>
      </div>
      <div className="sb-section" style={{ padding: '0 0 10px' }}>Uploaded sources · {session.sources.length}</div>
      <div className="source-list">
        {session.sources.map((src, i) => {
          const info = SOURCE_ICONS[src.type] || SOURCE_ICONS.pdf;
          return (
            <div key={i} className="source-item">
              <div className="source-icon" style={{ background: info.bg }}>
                <SourceTypeIcon type={src.type as any}/>
              </div>
              <div className="source-info">
                <b>{src.name}</b>
                <span>{src.type?.toUpperCase()}</span>
              </div>
              <button className="source-remove" title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
