import React from 'react';
import { SourceIcon } from '../../types/source';

export function SparkIcon({ size = 24, style }: { size?: number, style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" strokeLinecap="round" style={style}>
      <line x1="50" y1="41" x2="50" y2="16" stroke="#F4A12B" strokeWidth="7"/>
      <line x1="55.2" y1="42.6" x2="62.6" y2="32" stroke="#F4664A" strokeWidth="7"/>
      <line x1="58.5" y1="46.9" x2="76.3" y2="40.4" stroke="currentColor" strokeWidth="7"/>
      <line x1="42.6" y1="44.8" x2="28.7" y2="35.1" stroke="currentColor" strokeWidth="7"/>
      <line x1="41.5" y1="53.1" x2="21.8" y2="60.3" stroke="#C0512F" strokeWidth="7"/>
      <line x1="46.9" y1="58.5" x2="41.8" y2="72.6" stroke="#15635C" strokeWidth="7"/>
      <line x1="55.2" y1="57.4" x2="68.4" y2="76.2" stroke="currentColor" strokeWidth="7"/>
      <circle cx="50" cy="50" r="7" fill="#F4664A"/>
    </svg>
  );
}

export const SOURCE_ICONS: Record<string, SourceIcon> = {
  pdf: { color: '#C0512F', bg: 'color-mix(in srgb, #C0512F 14%, transparent)', path: 'M7 3h7l4 4v14H7zM14 3v4h4' },
  audio: { color: '#F4A12B', bg: 'color-mix(in srgb, #F4A12B 14%, transparent)', path: 'M5 14v-3a7 7 0 0 1 14 0v3M3.5 13h4v6h-4zM16.5 13h4v6h-4z' },
  video: { color: '#F4664A', bg: 'color-mix(in srgb, #F4664A 14%, transparent)', path: 'M3 5h18v14H3zM11 9.5l4 2.5-4 2.5z' },
  image: { color: '#15635C', bg: 'color-mix(in srgb, #15635C 14%, transparent)', path: 'M5 4h11l3 3v13H5zM8 9h6M8 13h8M8 17h5' },
};

export function SourceTypeIcon({ type, size = 17 }: { type: string, size?: number }) {
  const info = SOURCE_ICONS[type] || SOURCE_ICONS.pdf;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={info.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={info.path}/>
    </svg>
  );
}

const TAB_ICONS: Record<string, string> = {
  notes: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
  quiz: 'M4 4h16v16H4zM9 12l2 2 4-4',
  flashcards: 'M3 6h14v10H3zM7 16v2h12a2 2 0 0 0 2-2V8',
  chat: 'M21 12a8 8 0 1 1-3-6.2L21 4M21 4v4h-4',
  sources: 'M12 4v16M4 8l8-4 8 4M4 8v8l8 4 8-4V8',
};

export function TabIcon({ tab, size = 17 }: { tab: string, size?: number }) {
  const hasFill = tab === 'notes';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={TAB_ICONS[tab] || ''}/>
      {hasFill && <circle cx="12" cy="12" r="2.2" fill="#F4664A" stroke="none"/>}
    </svg>
  );
}

export const TAB_LABELS: Record<string, string> = { notes: 'Fused Notes', quiz: 'Quiz', flashcards: 'Flashcards', chat: 'Ask Kawe', sources: 'Sources' };
