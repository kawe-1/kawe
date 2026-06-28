export type AccountType = 'individual' | 'study_group' | 'course_group';

export interface GroupInfo {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  role: 'admin' | 'member';
}

export interface CourseInfo {
  id: string;
  name: string;
  code: string;
  instructor: string;
  memberCount: number;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
  subjects?: string[];
  style?: string;
  accountType?: AccountType;
  subjectArea?: string[];
  academicLevel?: string;
  institution?: string;
  group?: GroupInfo | null;
  course?: CourseInfo | null;
}

export type AuthStateStatus = 'landing' | 'signin' | 'onboarding' | 'app';
