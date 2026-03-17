const DEFAULT_API_BASE_URL = "https://application-tracker-suvm.onrender.com";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL;

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    message?: string;
  };
};

export type CurrentUser = {
  user: {
    id: string;
    email: string;
    name: string;
    email_verified?: boolean;
  };
  settings: {
    timezone: string;
    theme: string;
    weekly_summary?: boolean;
  } | null;
};

export type AuthResponse =
  | {
      token: string;
      user: {
        id: string;
        email: string;
        name: string;
      };
    }
  | {
      message: string;
    };

export type Application = {
  id: string;
  company: string;
  title: string;
  status: string;
  location?: string | null;
  salary_range?: string | null;
  applied_at?: string | null;
  interview_date?: string | null;
  notes: string[];
  stage_history: Array<{ stage: string; timestamp: string | null }>;
};

type ApplicationListResponse = {
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

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string;
};

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

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("The server returned an unexpected response.");
  }

  const payload = ((await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope) ?? {};
  if (!response.ok || !("data" in payload)) {
    const message = "error" in payload ? payload.error?.message : undefined;
    throw new Error(message ?? "Request failed.");
  }

  return payload.data;
}

export async function signIn(email: string, password: string) {
  return requestJson<AuthResponse>("/v1/auth/sign-in", {
    method: "POST",
    body: { email, password },
  });
}

export async function signUp(email: string, password: string, name: string) {
  return requestJson<AuthResponse>("/v1/auth/sign-up", {
    method: "POST",
    body: { email, password, name },
  });
}

export async function getCurrentUser(token: string) {
  return requestJson<CurrentUser>("/v1/auth/me", {
    token,
  });
}

export async function getApplications(
  token: string,
  query?: {
    q?: string;
    status?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  },
) {
  return requestJson<ApplicationListResponse>(withQuery("/v1/applications", query), {
    token,
  });
}

export async function createApplication(
  token: string,
  body: {
    company: string;
    title: string;
    status: string;
    location?: string;
    notes?: string[];
  },
) {
  return requestJson<Application>("/v1/applications", {
    method: "POST",
    body,
    token,
  });
}

export async function updateApplication(token: string, id: string, body: Partial<Application>) {
  return requestJson<Application>(`/v1/applications/${id}`, {
    method: "PATCH",
    body,
    token,
  });
}
