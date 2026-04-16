// ─────────────────────────────────────────────────────────────
// client/lib/api.ts
//
// All functions that talk to the Hono backend.
//
// Usage example in a login page:
//   import { login } from "@/lib/api";
//   const result = await login("user@email.com", "password123");
//   if (result.error) { show error } else { redirect }
// ─────────────────────────────────────────────────────────────

// Base URL of the Hono server.
// In development this is localhost:8000.
// In production Render sets NEXT_PUBLIC_API_URL automatically.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Streaming services  backend accepts for registration.
// Matches StreamingServiceSchema in server/models/enums.ts
export const STREAMING_SERVICES = [
  "Apple TV",
  "Prime Video",
  "Paramount",
  "Netflix",
  "HBO Max",
  "Disney+",
  "Peacock",
] as const;

export type StreamingService = (typeof STREAMING_SERVICES)[number];

// ── Shared response type ──────────────────────────────────
// Every function returns either data or an error string.
//  check result.error to show error messages.
type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

// ── Helper ────────────────────────────────────────────────
// Adds the Authorization header if a token is stored.
// backend requires: Authorization: Bearer <token>
function authHeaders(): HeadersInit {
  const token = localStorage.getItem("session_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ── Register ──────────────────────────────────────────────
// Calls POST /api/auth/register
// Matches RegisterBodySchema in server/validators/auth.ts:
//   email, password, username, owned_services (optional array)
export async function register(
  email: string,
  password: string,
  username: string,
  owned_services: StreamingService[] = [],
): Promise<ApiResult<{ user: unknown; session: unknown }>> {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username, owned_services }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error ?? "Registration failed." };
    }

    // Store the session token so future requests are authenticated
    if (json.session?.access_token) {
      localStorage.setItem("session_token", json.session.access_token);
    }

    return { data: json, error: null };
  } catch {
    return { data: null, error: "Could not reach the server." };
  }
}

// ── Login ─────────────────────────────────────────────────
// Calls POST /api/auth/login
// Matches LoginBodySchema in server/validators/auth.ts:
//   email, password
export async function login(
  email: string,
  password: string,
): Promise<ApiResult<{ user: unknown; session: unknown }>> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error ?? "Login failed." };
    }

    // Store the session token for future authenticated requests
    if (json.session?.access_token) {
      localStorage.setItem("session_token", json.session.access_token);
    }

    return { data: json, error: null };
  } catch {
    return { data: null, error: "Could not reach the server." };
  }
}

// ── Sign out ──────────────────────────────────────────────
// Calls POST /api/auth/signout
// Sends the stored Bearer token so the backend can invalidate it
export async function signout(): Promise<ApiResult<{ message: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/auth/signout`, {
      method: "POST",
      headers: authHeaders(),
    });

    const json = await res.json();

    // Always clear the local token regardless of server response
    localStorage.removeItem("session_token");

    if (!res.ok) {
      return { data: null, error: json.error ?? "Sign out failed." };
    }

    return { data: json, error: null };
  } catch {
    localStorage.removeItem("session_token");
    return { data: null, error: "Could not reach the server." };
  }
}

// ── Get current session ───────────────────────────────────
// Checks if a token exists locally.
//  use this to decide whether to show
// the login button or the user's profile.
export function getSessionToken(): string | null {
  return localStorage.getItem("session_token");
}

export function isLoggedIn(): boolean {
  return !!getSessionToken();
}
