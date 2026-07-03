import type { AcademicLevel } from '../types/user';

export const ACADEMIC_LEVELS: { id: AcademicLevel; label: string }[] = [
  { id: 'o_level', label: 'O-Level' },
  { id: 'undergraduate', label: 'Undergraduate' },
  { id: 'postgraduate', label: 'Postgraduate' },
];

export const ACADEMIC_FIELDS: Record<AcademicLevel, string[]> = {
  o_level: ['Commercial', 'Arts', 'Sciences'],
  undergraduate: ['Engineering', 'Social Sciences', 'Arts & Culture', 'Sciences', 'Business & Commerce', 'Law'],
  postgraduate: ['Engineering', 'Social Sciences', 'Arts & Culture', 'Sciences', 'Business & Commerce', 'Law'],
};
