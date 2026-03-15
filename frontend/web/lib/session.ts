import { cookies } from "next/headers";

export const SESSION_COOKIE = "job_tracker_session";

export type Session = {
  token: string;
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
