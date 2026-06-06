import api from "../axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

/** Single entry from GET /api/sessions/:sessionId/chat */
export interface ChatHistoryEntry {
  role: ChatRole;
  message: string;
  created_at: string; // ISO 8601 timestamp
}

/** Response from POST /api/sessions/:sessionId/chat */
export interface ChatResponse {
  answer: string;
  sources?: string[]; // cited source names returned by RAG layer, if any
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/chat
 * Send a user message to the RAG-backed AI tutor.
 * Both the user message and the assistant reply are persisted server-side.
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>(
    `/api/sessions/${sessionId}/chat`,
    { message },
  );
  return data;
}

/**
 * GET /api/sessions/:sessionId/chat
 * Fetch the full conversation history for a session, oldest-first.
 */
export async function getChatHistory(
  sessionId: string,
): Promise<ChatHistoryEntry[]> {
  const { data } = await api.get<ChatHistoryEntry[]>(
    `/api/sessions/${sessionId}/chat`,
  );
  return data;
}
