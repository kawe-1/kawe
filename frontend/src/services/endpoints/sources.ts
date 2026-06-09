import api from "../axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Returned by every upload endpoint */
export interface IngestionJob {
  job_id: string;
  source_id: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a FormData payload from a File and POST it.
 * Shared by all three file-upload ingesters.
 */
async function uploadFile(url: string, file: File): Promise<IngestionJob> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<IngestionJob>(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/:sessionId/sources/document
 * Accepted formats: PDF, DOCX, PPTX, HTML.
 * Returns a job ID for polling and a source ID.
 */
export async function uploadDocument(
  sessionId: string,
  file: File,
): Promise<IngestionJob> {
  return uploadFile(`/api/sessions/${sessionId}/sources/document`, file);
}

/**
 * POST /api/sessions/:sessionId/sources/audio
 * Accepted formats: MP3, WAV, M4A.
 */
export async function uploadAudio(
  sessionId: string,
  file: File,
): Promise<IngestionJob> {
  return uploadFile(`/api/sessions/${sessionId}/sources/audio`, file);
}

/**
 * POST /api/sessions/:sessionId/sources/image
 * Accepted formats: PNG, JPG, JPEG, WEBP.
 */
export async function uploadImage(
  sessionId: string,
  file: File,
): Promise<IngestionJob> {
  return uploadFile(`/api/sessions/${sessionId}/sources/image`, file);
}

/**
 * POST /api/sessions/:sessionId/sources/youtube
 * Submit a YouTube URL for transcript ingestion.
 */
export async function submitYouTubeUrl(
  sessionId: string,
  url: string,
): Promise<IngestionJob> {
  const { data } = await api.post<IngestionJob>(
    `/api/sessions/${sessionId}/sources/youtube`,
    { url },
  );
  return data;
}

/**
 * POST /api/sessions/:sessionId/sources/web
 * Submit a web URL for content ingestion.
 */
export async function submitWebUrl(
  sessionId: string,
  url: string,
): Promise<IngestionJob> {
  const { data } = await api.post<IngestionJob>(
    `/api/sessions/${sessionId}/sources/web`,
    { url },
  );
  return data;
}

/**
 * GET /api/sessions/:sessionId/sources
 * List all sources attached to a session.
 */
export async function listSources(
  sessionId: string,
): Promise<import("./sessions").Source[]> {
  const { data } = await api.get<import("./sessions").Source[]>(
    `/api/sessions/${sessionId}/sources`,
  );
  return data;
}

/**
 * DELETE /api/sources/:sourceId
 * Remove a source record, its uploaded file, and its vectors from the store.
 */
export async function deleteSource(
  sourceId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/api/sources/${sourceId}`,
  );
  return data;
}
