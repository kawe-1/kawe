export type AccountType = 'individual' | 'study_group' | 'course_group';
export type AcademicLevel = 'o_level' | 'undergraduate' | 'postgraduate';

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

/** A study context the user can switch between — their solo space, or a joined group/course. */
export interface Workspace {
  id: string; // 'individual' | group.id | course.id
  type: AccountType;
  label: string;
  group?: GroupInfo | null;
  course?: CourseInfo | null;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
  subjects?: string[];
  style?: string;
  accountType?: AccountType;
  subjectArea?: string[];
  academicLevel?: AcademicLevel | string;
  academicField?: string;
  institution?: string;
  group?: GroupInfo | null;
  course?: CourseInfo | null;
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

export type AuthStateStatus = 'landing' | 'signin' | 'onboarding' | 'app';
