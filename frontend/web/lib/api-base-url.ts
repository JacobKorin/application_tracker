const DEFAULT_API_BASE_URL = "https://application-tracker-suvm.onrender.com";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL;

export const API_READY_URL = `${API_BASE_URL}/ready`;
