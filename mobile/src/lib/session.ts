import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CurrentUser } from "./api";

const SESSION_STORAGE_KEY = "job-tracker-mobile-session-v1";

export type Session = {
  token: string;
  user: CurrentUser["user"];
};

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function saveSession(session: Session) {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
