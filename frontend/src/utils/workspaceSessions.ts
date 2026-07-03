// Maps session id -> workspace id, so sessions created while inside a group or
// course context stay scoped to that context on the dashboard. The sessions API
// has no workspace concept yet, so this is tracked client-side until it does.

const STORAGE_KEY = 'kawe_session_workspace_map';

function loadMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function tagSessionWorkspace(sessionId: string, workspaceId: string) {
  const map = loadMap();
  map[sessionId] = workspaceId;
  saveMap(map);
}

export function getSessionWorkspace(sessionId: string): string {
  return loadMap()[sessionId] || 'individual';
}
