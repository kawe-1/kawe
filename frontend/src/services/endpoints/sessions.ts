import api from "../axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SourceType = "document" | "audio" | "image" | "youtube";

export type SourceStatus = "pending" | "processing" | "completed" | "failed";

export interface Source {
  id: string;
  session_id: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  path_or_url: string;
}

export interface SessionArtifacts {
  notes: boolean;
  quiz: boolean;
  flashcards: boolean;
  concepts: boolean;
}

/** Returned by GET /api/sessions (list) */
export interface SessionSummary {
  id: string;
  title: string;
}

/** Returned by GET /api/sessions/:id (detail) */
export interface SessionDetail extends SessionSummary {
  sources: Source[];
  artifacts: SessionArtifacts;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions
 * Create a new study session with the given title.
 */
export async function createSession(title: string): Promise<SessionSummary> {
  const { data } = await api.post<SessionSummary>("/api/sessions", { title });
  return data;
}

/**
 * GET /api/sessions
 * Return a flat list of all sessions (no sources or artifacts).
 */
export async function listSessions(): Promise<SessionSummary[]> {
  const { data } = await api.get<SessionSummary[]>("/api/sessions");
  return data;
}

/**
 * GET /api/sessions/:sessionId
 * Return full session detail — sources and artifact availability flags included.
 */
export async function getSession(sessionId: string): Promise<SessionDetail> {
  const { data } = await api.get<SessionDetail>(`/api/sessions/${sessionId}`);
  return data;
}

/**
 * DELETE /api/sessions/:sessionId
 * Permanently delete session, its sources, uploaded files, and vector store.
 */
export async function deleteSession(
  sessionId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/api/sessions/${sessionId}`,
  );
  return data;
}
