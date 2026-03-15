import { getSession, Session } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    message?: string;
  };
};

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

  const payload = ((await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope) ?? {};
  if (!response.ok || !("data" in payload)) {
    const message = "error" in payload ? payload.error?.message : undefined;
    throw new Error(message ?? "Request failed.");
  }

  return payload.data;
}

export async function signUp(email: string, password: string, name: string) {
  return requestJson<{ token: string; user: { id: string; email: string; name: string } }>(
    "/v1/auth/sign-up",
    {
      method: "POST",
      body: { email, password, name },
      session: null,
    },
  );
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

export async function getApplications() {
  return requestJson<Array<Application>>("/v1/applications");
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
