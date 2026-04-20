import type { Session } from "@/types/api";

const SESSION_KEY = "pillarboxd.session";
const REFRESH_LEEWAY_SECONDS = 30;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  if (session === null) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  setSession(null);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

let refreshInFlight: Promise<Session> | null = null;

async function refreshSession(refresh_token: string): Promise<Session> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
      clearSession();
      const text = await res.text().catch(() => "");
      throw new ApiError(text || "Failed to refresh session", 401);
    }

    const data = (await res.json()) as { session: Session; user?: unknown };
    if (!data?.session?.access_token) {
      clearSession();
      throw new ApiError("Invalid refresh response", 401);
    }
    const next: Session = { ...data.session, user: data.user };
    setSession(next);
    return next;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function normalizePath(path: string): string {
  return path.startsWith("/api") ? path : `/api/${path.replace(/^\/+/, "")}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = normalizePath(path);

  let session = getSession();

  if (
    session &&
    typeof session.expires_at === "number" &&
    session.expires_at - nowSeconds() <= REFRESH_LEEWAY_SECONDS
  ) {
    try {
      session = await refreshSession(session.refresh_token);
    } catch (err) {
      clearSession();
      if (err instanceof ApiError) throw err;
      throw new ApiError("Session refresh failed", 401);
    }
  }

  const buildHeaders = (token: string | undefined): HeadersInit => {
    const headers = new Headers(init.headers ?? {});
    if (
      !headers.has("Content-Type") &&
      init.body &&
      !(init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: buildHeaders(session?.access_token),
    });
  } catch {
    clearSession();
    throw new ApiError("Network error", 0);
  }

  if (res.status === 401 && session?.refresh_token) {
    let refreshed: Session;
    try {
      refreshed = await refreshSession(session.refresh_token);
    } catch (err) {
      clearSession();
      if (err instanceof ApiError) throw err;
      throw new ApiError("Session refresh failed", 401);
    }

    try {
      res = await fetch(url, {
        ...init,
        headers: buildHeaders(refreshed.access_token),
      });
    } catch {
      clearSession();
      throw new ApiError("Network error", 0);
    }
  }

  if (res.status === 401) {
    clearSession();
    const message = await res.text().catch(() => "");
    throw new ApiError(message || "Unauthorized", 401);
  }

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new ApiError(
      message || `Request failed with status ${res.status}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
