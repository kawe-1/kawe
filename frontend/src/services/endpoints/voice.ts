import api from "../axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceQueryResponse {
  /** Whisper/Gemini transcript of the submitted audio */
  transcript: string;
  /** RAG-generated answer text */
  answer: string;
  /** Relative URL to the generated WAV file — prefix with VITE_API_URL to play */
  audio_url: string;
}

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/voice
 *
 * Submit a recorded audio clip as a voice query. The server will:
 *   1. Transcribe the audio with Gemini (or a mock provider).
 *   2. Run the transcript through the RAG pipeline.
 *   3. Convert the AI answer to speech.
 *   4. Return the transcript, text answer, and a URL to the audio response.
 *
 * @param sessionId  Target session.
 * @param audioBlob  Raw audio blob — typically a `MediaRecorder` output.
 *                   Sent as `multipart/form-data` under the key `file`.
 * @param filename   Optional filename hint including extension (e.g. "query.webm").
 *                   Defaults to "voice_query.webm".
 */
export async function sendVoiceQuery(
  sessionId: string,
  audioBlob: Blob,
  filename = "voice_query.webm",
): Promise<VoiceQueryResponse> {
  const form = new FormData();
  form.append("file", audioBlob, filename);

  const { data } = await api.post<VoiceQueryResponse>(
    `/api/sessions/${sessionId}/voice`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
}

// ---------------------------------------------------------------------------
// Helper — resolve the audio URL to an absolute URL for playback
// ---------------------------------------------------------------------------

/**
 * Prepend the API base URL to the relative `audio_url` returned by the server.
 *
 * Usage:
 *   const src = resolveAudioUrl(response.audio_url);
 *   audioElement.src = src;
 */
export function resolveAudioUrl(audioUrl: string): string {
  const base =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:8000";
  return `${base.replace(/\/$/, "")}${audioUrl}`;
}
