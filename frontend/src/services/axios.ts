import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  timeout: 60_000, // generous for AI generation endpoints
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Mock Adapter
// ---------------------------------------------------------------------------

if (import.meta.env.VITE_USE_MOCK === "true") {
  console.log("[Mock] Enabled. Intercepting API requests.");
  api.defaults.adapter = async (config) => {
    // Artificial network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const { url, method, data: configData } = config;
    const path = url?.replace(api.defaults.baseURL || "", "").split("?")[0] || "";

    // Dynamic imports to avoid bundling mock data in production if possible,
    // though for simplicity we can just await the imports.
    const mocks = await import("./mocks/sessions");
    const artifacts = await import("./mocks/artifacts");
    const chat = await import("./mocks/chat");

    const response = <T>(data: T, status = 200): AxiosResponse<T> => ({
      data,
      status,
      statusText: "OK",
      headers: {},
      config,
    });

    if (method === "get" && path === "/api/sessions") {
      return response(mocks.MOCK_SESSION_SUMMARIES);
    }
    if (method === "post" && path === "/api/sessions") {
      const payload = JSON.parse(configData || "{}");
      return response({ id: "new-" + Date.now(), title: payload.title });
    }
    const sessionMatch = path.match(/^\/api\/sessions\/([^\/]+)$/);
    if (method === "get" && sessionMatch) {
      const id = sessionMatch[1];
      if (mocks.MOCK_SESSION_DETAILS[id]) {
        return response(mocks.MOCK_SESSION_DETAILS[id]);
      }
      return Promise.reject(new ApiError("Not found", 404));
    }
    const sourcesMatch = path.match(/^\/api\/sessions\/([^\/]+)\/sources$/);
    if (method === "get" && sourcesMatch) {
      const id = sourcesMatch[1];
      return response(mocks.MOCK_SESSION_DETAILS[id]?.sources || []);
    }

    const notesMatch = path.match(/^\/api\/sessions\/([^\/]+)\/notes$/);
    if (notesMatch) return response(artifacts.MOCK_NOTES);

    const quizMatch = path.match(/^\/api\/sessions\/([^\/]+)\/quiz$/);
    if (quizMatch) return response(artifacts.MOCK_QUIZ);

    const flashcardsMatch = path.match(/^\/api\/sessions\/([^\/]+)\/flashcards$/);
    if (flashcardsMatch) return response(artifacts.MOCK_FLASHCARDS);

    const conceptsMatch = path.match(/^\/api\/sessions\/([^\/]+)\/concepts$/);
    if (conceptsMatch) return response(artifacts.MOCK_CONCEPTS);

    const chatMatch = path.match(/^\/api\/sessions\/([^\/]+)\/chat$/);
    if (method === "get" && chatMatch) {
      return response(chat.MOCK_CHAT_HISTORY);
    }
    if (method === "post" && chatMatch) {
      return response({ answer: "This is a mocked response from the AI." });
    }

    // Default 404 for unmapped endpoints
    return Promise.reject(new ApiError(`Mock unhandled: ${method?.toUpperCase()} ${path}`, 404));
  };
}

// ---------------------------------------------------------------------------
// Request interceptor — attach auth token when present
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("kawe_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — normalise error shape
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail?: string | { msg: string }[] }>) => {
    if (!error.response) {
      // Network / timeout
      return Promise.reject(
        new ApiError("Network error — check your connection.", 0),
      );
    }

    const { status, data } = error.response;

    // FastAPI validation errors arrive as an array under `detail`
    let message = "An unexpected error occurred.";
    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((d) => d.msg).join("; ");
    }

    return Promise.reject(new ApiError(message, status));
  },
);

// ---------------------------------------------------------------------------
// Typed error class — lets callers do `err instanceof ApiError`
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export default api;
