const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "X-User-Id": "demo-user",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export async function getApplications() {
  return fetchJson<Array<{ id: string; company: string; title: string; status: string }>>("/v1/applications");
}

export async function getTasks() {
  return fetchJson<Array<{ id: string; title: string; due_at?: string; completed?: boolean }>>("/v1/tasks");
}

export async function getSettings() {
  return fetchJson<{ timezone: string; theme: string; weekly_summary?: boolean }>("/v1/settings");
}

