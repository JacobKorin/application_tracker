import { getSession, Session } from "@/lib/session";
import { API_BASE_URL, API_READY_URL } from "@/lib/api-base-url";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    message?: string;
  };
};

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends Error {
  constructor(message = "Too many attempts. Please wait and try again.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class UpstreamResponseError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "UpstreamResponseError";
    this.statusCode = statusCode;
  }
}

export type Application = {
  id: string;
  company: string;
  title: string;
  status: string;
  location?: string | null;
  salary_range?: string | null;
  applied_at?: string | null;
  notes: string[];
  interview_date?: string | null;
  stage_history: Array<{ stage: string; timestamp: string }>;
};

export type ApplicationListResponse = {
  items: Application[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: {
    q: string;
    status: string;
    sort: string;
  };
};

export type Task = {
  id: string;
  title: string;
  application_id?: string | null;
  due_at?: string | null;
  completed?: boolean;
};

export type Reminder = {
  id: string;
  title: string;
  application_id?: string | null;
  task_id?: string | null;
  scheduled_for: string;
  channel: string;
};

export type Settings = {
  timezone: string;
  theme: string;
  weekly_summary?: boolean;
};

export type CurrentUser = {
  user: {
    id: string;
    email: string;
    name: string;
    email_verified?: boolean;
  };
  settings: Settings | null;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  session?: Session | null;
  idempotencyKey?: string;
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 500, 502, 503, 504]);
const RETRYABLE_AUTH_PATHS = new Set(["/v1/auth/sign-in", "/v1/auth/sign-up"]);
const API_READY_POLL_INTERVAL_MS = 1_500;
const API_READY_TIMEOUT_MS = 45_000;

let pendingApiReadyCheck: Promise<void> | null = null;

function buildHeaders(session: Session | null, idempotencyKey?: string): HeadersInit {
  const headers: Record<string, string> = {};

  if (session) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return headers;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryRequest(path: string, options: RequestOptions): boolean {
  const method = options.method ?? "GET";
  return method === "GET" || RETRYABLE_AUTH_PATHS.has(path) || Boolean(options.idempotencyKey);
}

function isTransientResponse(response: Response): boolean {
  if (RETRYABLE_STATUS_CODES.has(response.status)) {
    return true;
  }

  if (response.status !== 429) {
    return false;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return !contentType.includes("application/json");
}

function isTransientFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("socket") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("enotfound")
  );
}

async function pollApiReady(): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < API_READY_TIMEOUT_MS) {
    try {
      const response = await fetch(API_READY_URL, {
        cache: "no-store",
      });
      if (response.ok) {
        return;
      }
      lastError = new UpstreamResponseError(`API readiness check failed with ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await sleep(API_READY_POLL_INTERVAL_MS);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new UpstreamResponseError("API did not become ready in time.");
}

async function waitForApiReady() {
  if (!pendingApiReadyCheck) {
    pendingApiReadyCheck = pollApiReady().finally(() => {
      pendingApiReadyCheck = null;
    });
  }

  await pendingApiReadyCheck;
}

async function fetchJsonResponse(path: string, options: RequestOptions, session: Session | null) {
  const replaySafe = shouldRetryRequest(path, options);
  let lastError: unknown;

  for (let attempt = 0; attempt < (replaySafe ? 2 : 1); attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...buildHeaders(session, options.idempotencyKey),
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      });

      if (attempt === 0 && replaySafe && isTransientResponse(response)) {
        await waitForApiReady();
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt === 0 && replaySafe && isTransientFetchError(error)) {
        await waitForApiReady();
        continue;
      }

      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new UpstreamResponseError("Request failed before the API became ready.");
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = options.session ?? (await getSession());
  const response = await fetchJsonResponse(path, options, session);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const body = await response.text();
    const preview = body.slice(0, 120).trim();
    if (response.status === 429) {
      throw new UpstreamResponseError(
        `API returned an upstream 429 response. Received: ${preview || "empty response"}`,
        429,
      );
    }
    if (response.status >= 500) {
      throw new UpstreamResponseError(
        `API returned an upstream ${response.status} response. Received: ${preview || "empty response"}`,
        response.status,
      );
    }
    throw new Error(
      `API returned a non-JSON response. Check NEXT_PUBLIC_API_BASE_URL. Received: ${preview || "empty response"}`,
    );
  }

  const payload = ((await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope) ?? {};
  if (!response.ok || !("data" in payload)) {
    const message = "error" in payload ? payload.error?.message : undefined;
    if (response.status === 401) {
      throw new UnauthorizedError(message ?? "Unauthorized");
    }
    if (response.status === 429) {
      const normalizedMessage = (message ?? "").toLowerCase();
      if (normalizedMessage.includes("too many") || normalizedMessage.includes("rate limit")) {
        throw new RateLimitError(message ?? "Too many attempts. Please wait and try again.");
      }
      throw new UpstreamResponseError(message ?? "Request failed.", 429);
    }
    if (response.status >= 500) {
      throw new UpstreamResponseError(message ?? "Request failed.", response.status);
    }
    throw new Error(message ?? "Request failed.");
  }

  return payload.data;
}

function withQuery(path: string, query?: Record<string, string | number | undefined>) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export async function signUp(email: string, password: string, name: string) {
  return requestJson<
    | { token: string; user: { id: string; email: string; name: string } }
    | { message: string }
  >("/v1/auth/sign-up", {
    method: "POST",
    body: { email, password, name },
    session: null,
  });
}

export async function signIn(email: string, password: string) {
  return requestJson<{ token: string; user: { id: string; email: string; name: string } }>(
    "/v1/auth/sign-in",
    {
      method: "POST",
      body: { email, password },
      session: null,
    },
  );
}

export async function getApplications(query?: {
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}) {
  return requestJson<ApplicationListResponse>(withQuery("/v1/applications", query));
}

export async function getCurrentUser() {
  return requestJson<CurrentUser>("/v1/auth/me");
}

export async function getTasks() {
  return requestJson<Array<Task>>("/v1/tasks");
}

export async function getReminders() {
  return requestJson<Array<Reminder>>("/v1/reminders");
}

export async function getSettings() {
  return requestJson<Settings>("/v1/settings");
}

export async function createApplication(body: {
  company: string;
  title: string;
  status: string;
  location?: string;
  notes?: string[];
}) {
  return requestJson<Application>("/v1/applications", {
    method: "POST",
    body,
  });
}

export async function updateApplication(id: string, body: Partial<Application>) {
  return requestJson<Application>(`/v1/applications/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteApplication(id: string) {
  return requestJson<{ id: string; deleted: boolean }>(`/v1/applications/${id}`, {
    method: "DELETE",
  });
}

export async function createTask(body: {
  title: string;
  application_id?: string;
  due_at?: string;
  completed?: boolean;
}) {
  return requestJson<Task>("/v1/tasks", {
    method: "POST",
    body,
  });
}

export async function updateTask(id: string, body: Partial<Task>) {
  return requestJson<Task>(`/v1/tasks/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteTask(id: string) {
  return requestJson<{ id: string; deleted: boolean }>(`/v1/tasks/${id}`, {
    method: "DELETE",
  });
}

export async function createReminder(body: {
  title: string;
  application_id?: string;
  task_id?: string;
  scheduled_for: string;
  channel: string;
}) {
  return requestJson<Reminder>("/v1/reminders", {
    method: "POST",
    body,
  });
}

export async function deleteReminder(id: string) {
  return requestJson<{ id: string; deleted: boolean }>(`/v1/reminders/${id}`, {
    method: "DELETE",
  });
}

export async function updateSettings(body: Partial<Settings>) {
  return requestJson<Settings>("/v1/settings", {
    method: "PATCH",
    body,
  });
}
