// Demo-mode data for group/course endpoints. Groups created or joined during a
// session are kept in localStorage so codes stay valid across page reloads.

const GROUPS_KEY = 'kawe_demo_groups';

interface DemoGroup {
  id: string;
  name: string;
  code: string;
  memberCount: number;
}

function loadGroups(): Record<string, DemoGroup> {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveGroups(groups: Record<string, DemoGroup>) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KW-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createDemoGroup(name: string): DemoGroup {
  const groups = loadGroups();
  const group: DemoGroup = { id: 'grp-' + Date.now(), name, code: randomCode(), memberCount: 1 };
  groups[group.code] = group;
  saveGroups(groups);
  return group;
}

export function joinDemoGroup(code: string): DemoGroup | null {
  const groups = loadGroups();
  const group = groups[code];
  if (!group) return null;
  group.memberCount += 1;
  saveGroups(groups);
  return group;
}

export const DEMO_COURSES: Record<string, { id: string; name: string; code: string; instructor: string; memberCount: number }> = {
  'BIO-2024': { id: 'crs-1', name: 'Introduction to Biology', code: 'BIO-2024', instructor: 'Prof. Adams', memberCount: 28 },
  'CS-101':   { id: 'crs-2', name: 'Computer Science Fundamentals', code: 'CS-101', instructor: 'Dr. Chen', memberCount: 45 },
  'MED-3A':   { id: 'crs-3', name: 'Medical Biochemistry', code: 'MED-3A', instructor: 'Prof. Okonkwo', memberCount: 19 },
  'LAW-202':  { id: 'crs-4', name: 'Contract Law Essentials', code: 'LAW-202', instructor: 'Dr. Williams', memberCount: 31 },
  'MATH-301': { id: 'crs-5', name: 'Linear Algebra', code: 'MATH-301', instructor: 'Prof. Nakamura', memberCount: 22 },
  'PSY-110':  { id: 'crs-6', name: 'Introduction to Psychology', code: 'PSY-110', instructor: 'Dr. Osei', memberCount: 38 },
};
