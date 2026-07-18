export type AccountType = 'individual' | 'study_group' | 'course_group';
export type AcademicLevel = 'o_level' | 'undergraduate' | 'postgraduate';

export interface GroupInfo {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
}

export interface CourseInfo {
  id: string;
  name: string;
  code: string;
  instructor: string;
  memberCount: number;
}

export interface Workspace {
  id: string;
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
  subjectArea?: string[];
  academicLevel?: AcademicLevel | string;
  academicField?: string;
  institution?: string;
  groups: GroupInfo[];
  courses: CourseInfo[];
  activeWorkspaceId?: string;
}

export function getProfileWorkspaces(profile?: UserProfile | null): Workspace[] {
  const workspaces: Workspace[] = [
    { id: 'individual', type: 'individual', label: 'Individual' },
  ];

  profile?.groups?.forEach(g => {
    workspaces.push({
      id: g.id,
      type: 'study_group',
      label: g.name,
      group: g,
    });
  });

  profile?.courses?.forEach(c => {
    workspaces.push({
      id: c.id,
      type: 'course_group',
      label: c.name,
      course: c,
    });
  });

  return workspaces;
}

export function getActiveWorkspaceId(profile?: UserProfile | null): string {
  // 1. User preference (saved choice)
  if (profile?.activeWorkspaceId) {
    return profile.activeWorkspaceId;
  }

  // 2. Fallback to first available workspace
  const workspaces = getProfileWorkspaces(profile);

  // Prefer groups over courses if both exist, or just return first non-individual
  const nonIndividual = workspaces.find(w => w.id !== 'individual');
  return nonIndividual?.id || 'individual';
}

export type AuthStateStatus = 'landing' | 'signin' | 'onboarding' | 'app';
