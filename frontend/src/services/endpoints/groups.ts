import api from '../axios';
import { GroupInfo, CourseInfo } from '../../types/user';

export interface CreateGroupResponse extends GroupInfo { }

export interface JoinGroupResponse extends GroupInfo { }
export interface JoinCourseResponse extends CourseInfo { }

export async function createGroup(name: string): Promise<CreateGroupResponse> {
  const { data } = await api.post<CreateGroupResponse>('/api/groups', { name });
  return data;
}

export async function joinGroup(code: string): Promise<JoinGroupResponse> {
  const { data } = await api.post<JoinGroupResponse>('/api/groups/join', { code });
  return data;
}

export async function joinCourse(code: string): Promise<JoinCourseResponse> {
  const { data } = await api.post<JoinCourseResponse>('/api/courses/join', { code });
  return data;
}

export async function updateUserProfile(payload: {
  name?: string;
  subject_area?: string[];
  academic_level?: string;
  institution?: string;
  group_id?: string | null;
  course_id?: string | null;
  has_onboarded?: boolean;
}): Promise<void> {
  await api.put('/api/users/me', payload);
}
