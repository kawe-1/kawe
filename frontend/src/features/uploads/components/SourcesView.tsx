import React, { useEffect } from 'react';
import { SessionDetail } from '../../../services/endpoints/sessions';
import { SourceTypeIcon, SOURCE_ICONS } from '../../../components/ui/Icons';
import { useFileUpload, MAX_FILE_SIZE_MB } from '../hooks';
import {
  deleteSource,
} from "../../../services/endpoints/sources";
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
  const handleUploadZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteSource =
    async (
      sourceId: string
    ) => {
      try {
        await deleteSource(
          sourceId
        );

        onUpload?.();
      } catch (err) {
        console.error(err);
      }
    };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
      // Reset file input so same file can be uploaded again
      e.target.value = '';
    }
  };

  return (
    <div>
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.pptx,.html,.htm,.mp3,.wav,.m4a,.png,.jpg,.jpeg,.webp"
        disabled={uploading}
      />

      {/* Upload errors display */}
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

      {/* Upload progress display */}
      {Object.keys(statuses).length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {Object.entries(statuses).map(
            ([fileName, status]) => (
              <div key={fileName}>
                <b>{fileName} </b>

                <span>
                  {
                    {
                      uploading:
                        "Uploading...",
                      queued:
                        "Queued for processing...",
                      processing:
                        "Processing content...",
                      completed:
                        "Ready",
                      failed:
                        "Failed",
                    }[status]
                  }
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="sb-section" style={{ padding: '0 0 10px' }}>Uploaded sources · {session.sources.length}</div>
      <div className="source-list">
        {session.sources.map((src, i) => {
          const info = SOURCE_ICONS[src.type] || SOURCE_ICONS.pdf;
          const isProcessing =
            src.status ===
            "processing";
          const isFailed =
            src.status ===
            "failed";

          return (
            <div key={i} className="source-item" style={{ opacity: isProcessing ? 0.6 : 1 }}>
              <div className="source-icon" style={{ background: info.bg, position: 'relative' }}>
                <SourceTypeIcon type={src.type as any} />
                {isProcessing && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7em',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}>
                    ⏳
                  </div>
                )}
                {isFailed &&
                  "Failed"}
              </div>
              <div className="source-info">
                <b>{src.name}</b>
                <span>{src.type?.toUpperCase()}</span>
              </div>
              <button
                className="source-remove"
                onClick={() =>
                  handleDeleteSource(
                    src.id
                  )
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
