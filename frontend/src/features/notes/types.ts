export interface NoteSection {
  heading: string;
  body: string;
  cite: string;
}

export interface NoteData extends NoteSection {}

export interface NotesData {
  sections: NoteSection[];
}

export interface Concept {
  term: string;
  explanation: string;
}

export interface ConceptsData {
  concepts: Concept[];
}
