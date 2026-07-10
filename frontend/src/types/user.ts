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
  group?: GroupInfo | null;
  course?: CourseInfo | null;
  activeWorkspaceId?: string;
}

export function getProfileWorkspaces(profile?: UserProfile | null): Workspace[] {
  const workspaces: Workspace[] = [
    { id: 'individual', type: 'individual', label: 'Individual' },
  ];

  if (profile?.group) {
    workspaces.push({
      id: profile.group.id,
      type: 'study_group',
      label: profile.group.name,
      group: profile.group,
    });
  }

  if (profile?.course) {
    workspaces.push({
      id: profile.course.id,
      type: 'course_group',
      label: profile.course.name,
      course: profile.course,
    });
  }

  return workspaces;
}

export function getActiveWorkspaceId(profile?: UserProfile | null): string {
  if (profile?.activeWorkspaceId) return profile.activeWorkspaceId;
  if (profile?.group?.id) return profile.group.id;
  if (profile?.course?.id) return profile.course.id;
  return 'individual';
}

export type AuthStateStatus = 'landing' | 'signin' | 'onboarding' | 'app';
