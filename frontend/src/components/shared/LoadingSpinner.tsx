import React from 'react';

interface LoadingSpinnerProps {
    label?: string;
}

export function LoadingSpinner({ label = 'Loading…' }: LoadingSpinnerProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                gap: 16,
                color: 'var(--muted)',
            }}
        >
            <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--marigold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ animation: 'spin 1s linear infinite' }}
            >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        </div>
    );
}
