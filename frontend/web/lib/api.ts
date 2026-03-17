import { getSession, Session } from "@/lib/session";

const DEFAULT_API_BASE_URL = "https://application-tracker-suvm.onrender.com";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL;

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
  constructor(message: string) {
    super(message);
    this.name = "UpstreamResponseError";
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

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = options.session ?? (await getSession());
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...buildHeaders(session, options.idempotencyKey),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const body = await response.text();
    const preview = body.slice(0, 120).trim();
    if (response.status === 429) {
      throw new RateLimitError("Too many attempts. Please wait a few minutes and try again.");
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
      throw new RateLimitError(message ?? "Too many attempts. Please wait and try again.");
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
