import React, { useState } from 'react';
import { SessionDetail } from '../../../services/endpoints/sessions';
import { SourceTypeIcon, SOURCE_ICONS } from '../../../components/ui/Icons';
import { useFileUpload, MAX_FILE_SIZE_MB } from '../hooks';
import {
  deleteSource,
  submitYouTubeUrl,
  submitWebUrl,
} from "../../../services/endpoints/sources";
import { pollJob } from '../../../services/endpoints/jobs';

interface SourcesViewProps {
  session: SessionDetail;
  onUpload?: () => void;
}

export function SourcesView({ session, onUpload }: SourcesViewProps) {
  const {
    fileInputRef,
    isDragging,
    statuses,
    uploading,
    errors,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resetErrors,
  } = useFileUpload(session.id, onUpload);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const handleUploadZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
      e.target.value = ''; // Reset file input so same file can be uploaded back-to-back
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await deleteSource(sourceId);
      onUpload?.();
    } catch (err) {
      console.error(err);
    }
  };

  // Generalized helper handling both url types to cut down execution block footprint
  const handleUrlSubmit = async (
    url: string,
    submitFn: (sessionId: string, url: string) => Promise<{ job_id: string }>,
    clearInput: () => void,
    errorMessage: string
  ) => {
    if (!url.trim() || urlLoading) return;
    setUrlLoading(true);

    try {
      const job = await submitFn(session.id, url);
      await pollJob(job.job_id);
      clearInput();
      onUpload?.();
    } catch (err) {
      console.error(err);
      alert(errorMessage);
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div>
      {/* Drag & Drop Zone */}
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onClick={handleUploadZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <h4>Drop files here or click to upload</h4>
        <p>PDF, audio, images (Max {MAX_FILE_SIZE_MB}MB each)</p>
        {uploading && <p style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>Uploading...</p>}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.pptx,.html,.htm,.mp3,.wav,.m4a,.png,.jpg,.jpeg,.webp"
        disabled={uploading}
      />

      {/* Remote URL Ingestion Subsystems */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <UrlInputGroup
          label="YouTube URL"
          value={youtubeUrl}
          placeholder="https://youtube.com/watch?v=..."
          disabled={urlLoading}
          onChange={setYoutubeUrl}
          onSubmit={() => handleUrlSubmit(
            youtubeUrl,
            submitYouTubeUrl,
            () => setYoutubeUrl(''),
            'Failed to add YouTube URL. Please try again.'
          )}
        />

        <UrlInputGroup
          label="Web URL"
          value={webUrl}
          placeholder="https://example.com"
          disabled={urlLoading}
          onChange={setWebUrl}
          onSubmit={() => handleUrlSubmit(
            webUrl,
            submitWebUrl,
            () => setWebUrl(''),
            'Failed to add web URL. Please try again.'
          )}
        />
      </div>

      {/* Error Management Layout */}
      {errors.length > 0 && (
        <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#fee', borderRadius: '4px', border: '1px solid #fcc' }}>
          <div style={{ fontSize: '0.9em', color: '#c33', marginBottom: '4px' }}>Upload errors:</div>
          {errors.map((err, i) => (
            <div key={i} style={{ fontSize: '0.85em', color: '#c33', marginBottom: i < errors.length - 1 ? '4px' : '0' }}>
              • {err}
            </div>
          ))}
          <button
            onClick={resetErrors}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '0.85em',
              backgroundColor: 'transparent',
              border: '1px solid #c33',
              color: '#c33',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Ephemeral Hook Progress Ingestion List */}
      {Object.keys(statuses).length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {Object.entries(statuses).map(([fileName, status]) => (
            <div key={fileName}>
              <b>{fileName} </b>
              <span>
                {
                  {
                    uploading: "Uploading...",
                    queued: "Queued for processing...",
                    processing: "Processing content...",
                    completed: "Ready",
                    failed: "Failed",
                  }[status]
                }
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Active Session Inventory Records */}
      <div className="sb-section" style={{ padding: '16px 0 10px', fontWeight: 600 }}>
        Uploaded sources · {session.sources?.length || 0}
      </div>
      <div className="source-list">
        {session.sources?.map((src, i) => {
          const info = SOURCE_ICONS[src.type] || SOURCE_ICONS.pdf;
          const isProcessing = src.status === "processing";
          const isFailed = src.status === "failed";

          return (
            <div key={src.id || i} className="source-item" style={{ opacity: isProcessing ? 0.6 : 1 }}>
              <div className="source-icon" style={{ background: info?.bg, position: 'relative' }}>
                <SourceTypeIcon type={src.type as any} />
                {isProcessing && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7em', backgroundColor: 'rgba(0,0,0,0.1)',
                  }}>
                    ⏳
                  </div>
                )}
                {isFailed && "Failed"}
              </div>
              <div className="source-info">
                <b>{src.name}</b>
                <span>{src.type?.toUpperCase()}</span>
              </div>
              <button
                className="source-remove"
                onClick={() => handleDeleteSource(src.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Isolated Sub-components
// ---------------------------------------------------------------------------
interface UrlInputGroupProps {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (val: string) => void;
  onSubmit: () => void;
}

function UrlInputGroup({ label, value, placeholder, disabled, onChange, onSubmit }: UrlInputGroupProps) {
  const isFilled = value.trim().length > 0;

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '0.9em',
          }}
        />
        <button
          onClick={onSubmit}
          disabled={!isFilled || disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: isFilled && !disabled ? 'var(--primary)' : 'var(--bg2)',
            color: isFilled && !disabled ? '#fff' : 'var(--muted)',
            border: 'none',
            borderRadius: '4px',
            cursor: isFilled && !disabled ? 'pointer' : 'default',
            fontSize: '0.9em',
          }}
        >
          {disabled && isFilled ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}