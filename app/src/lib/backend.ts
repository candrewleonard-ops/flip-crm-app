// Backend configuration — single source of truth for data source switching.
//
// Today: all data lives in localStorage (see store.tsx).
// Tomorrow: set NEXT_PUBLIC_BACKEND_MODE=remote and NEXT_PUBLIC_API_URL
// to hook both the web app and desktop .exe up to the same server,
// so Marco and your team share one synced database.

export type BackendMode = "local" | "remote";

export const BACKEND_CONFIG = {
  mode: (process.env.NEXT_PUBLIC_BACKEND_MODE || "local") as BackendMode,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  // Auth token provided at runtime (set by desktop app or web login).
  getAuthToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("flipcrm_auth_token");
  },
};

export const isRemoteMode = () => BACKEND_CONFIG.mode === "remote" && BACKEND_CONFIG.apiUrl !== "";

// Thin REST client scaffold for when the remote backend exists.
// All store methods can flip to these with zero UI changes.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isRemoteMode()) {
    throw new Error("apiFetch called in local mode — use store directly");
  }
  const token = BACKEND_CONFIG.getAuthToken();
  const res = await fetch(`${BACKEND_CONFIG.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
