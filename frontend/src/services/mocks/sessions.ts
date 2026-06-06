import { SessionSummary, SessionDetail } from "../endpoints/sessions";

export const MOCK_SESSION_SUMMARIES: SessionSummary[] = [
  { id: 'mem', title: 'Cognitive Psychology: Memory' },
  { id: 'chem', title: 'Organic Chemistry: Bonding' },
  { id: 'hist', title: 'World History: The Renaissance' },
];

export const MOCK_SESSION_DETAILS: Record<string, SessionDetail> = {
  mem: {
    id: 'mem',
    title: 'Cognitive Psychology: Memory',
    sources: [
      { id: 's1', session_id: 'mem', name: 'Memory Systems.pdf', type: 'document', status: 'completed', path_or_url: '' },
      { id: 's2', session_id: 'mem', name: 'Tutorial Week 6.mp3', type: 'audio', status: 'completed', path_or_url: '' },
      { id: 's3', session_id: 'mem', name: 'How We Remember (YouTube)', type: 'youtube', status: 'completed', path_or_url: '' },
      { id: 's4', session_id: 'mem', name: 'Class notes photo.jpg', type: 'image', status: 'completed', path_or_url: '' },
    ],
    artifacts: { notes: true, quiz: true, flashcards: true, concepts: true }
  },
  chem: {
    id: 'chem',
    title: 'Organic Chemistry: Bonding',
    sources: [
      { id: 's5', session_id: 'chem', name: 'Covalent Bonds.pdf', type: 'document', status: 'completed', path_or_url: '' },
      { id: 's6', session_id: 'chem', name: 'Lab Session 3.mp3', type: 'audio', status: 'completed', path_or_url: '' },
      { id: 's7', session_id: 'chem', name: 'Orbital Hybridization (YouTube)', type: 'youtube', status: 'completed', path_or_url: '' },
    ],
    artifacts: { notes: false, quiz: false, flashcards: false, concepts: false }
  },
  hist: {
    id: 'hist',
    title: 'World History: The Renaissance',
    sources: [
      { id: 's8', session_id: 'hist', name: 'Florence and the Medici.pdf', type: 'document', status: 'completed', path_or_url: '' },
      { id: 's9', session_id: 'hist', name: 'Timeline sketch.jpg', type: 'image', status: 'completed', path_or_url: '' },
    ],
    artifacts: { notes: false, quiz: false, flashcards: false, concepts: false }
  }
};
