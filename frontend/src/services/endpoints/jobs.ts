import api from "../axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStatus = "processing" | "completed" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  /** Populated on success — contains `source_id` */
  result?: { source_id: string };
  /** Populated on failure — human-readable error from the ingestion worker */
  error?: string;
}

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

/**
 * GET /api/jobs/:jobId
 * Poll the status of a background ingestion job.
 *
 * Recommended polling strategy:
 *   - Start at 1 s intervals.
 *   - Back off to 3 s after 5 consecutive `processing` responses.
 *   - Stop polling on `completed` or `failed`.
 */
export async function getJob(jobId: string): Promise<Job> {
  const { data } = await api.get<Job>(`/api/jobs/${jobId}`);
  return data;
}

// ---------------------------------------------------------------------------
// Polling helper
// ---------------------------------------------------------------------------

export interface PollJobOptions {
  /** Initial interval in milliseconds. Default: 1000 */
  intervalMs?: number;
  /** Interval after `backoffAfter` polls. Default: 3000 */
  backoffMs?: number;
  /** Number of polls before switching to the backoff interval. Default: 5 */
  backoffAfter?: number;
  /** Maximum number of polls before rejecting. Default: 60 */
  maxAttempts?: number;
  /** Called on every poll with the current job state */
  onPoll?: (job: Job) => void;
}

/**
 * Poll a job until it reaches a terminal state (`completed` or `failed`).
 *
 * Resolves with the final `Job` object on completion.
 * Rejects with an `Error` if:
 *   - The job reaches `failed` status (message contains server error).
 *   - `maxAttempts` is exceeded.
 *
 * @example
 *   const job = await pollJob(jobId, { onPoll: (j) => console.log(j.status) });
 *   console.log("source ready:", job.result?.source_id);
 */
export function pollJob(
  jobId: string,
  options: PollJobOptions = {},
): Promise<Job> {
  const {
    intervalMs = 1_000,
    backoffMs = 3_000,
    backoffAfter = 5,
    maxAttempts = 60,
    onPoll,
  } = options;

  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tick = async () => {
      if (attempts >= maxAttempts) {
        reject(new Error(`Job ${jobId} timed out after ${maxAttempts} polls.`));
        return;
      }

      attempts++;

      try {
        const job = await getJob(jobId);
        onPoll?.(job);

        if (job.status === "completed") {
          resolve(job);
          return;
        }

        if (job.status === "failed") {
          reject(
            new Error(job.error ?? `Job ${jobId} failed without a reason.`),
          );
          return;
        }

        // Still processing — schedule next poll
        const delay = attempts >= backoffAfter ? backoffMs : intervalMs;
        setTimeout(tick, delay);
      } catch (err) {
        reject(err);
      }
    };

    tick();
  });
}
