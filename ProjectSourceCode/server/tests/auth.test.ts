/**
 * @file Unit tests for the /api/auth routes (register and login).
 * Mocks Supabase auth and the postgres database to test route logic in isolation.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Hono } from "hono";
import { jsonRequest } from "./helpers.ts";

/** Mock database — returns configurable rows per query. */
const mockResults: Record<string, unknown>[][] = [];
const mockSql: any = Object.assign(
  jest.fn(async () => mockResults.shift() ?? []),
  {
    array: (arr: unknown[]) => arr,
    json: (obj: unknown) => obj,
  },
);

/** Mock Supabase auth client. */
const mockSupabase = {
  auth: {
    signUp: jest.fn<any>(),
    signInWithPassword: jest.fn<any>(),
    getUser: jest.fn<any>(),
    admin: {
      deleteUser: jest.fn<any>(),
      signOut: jest.fn<any>(),
    },
  },
};

jest.unstable_mockModule("../db.ts", () => ({
  default: mockSql,
}));

jest.unstable_mockModule("../utils/supabase.ts", () => ({
  supabase: mockSupabase,
}));

/** Import auth routes AFTER mocks are registered. */
const { default: auth } = await import("../routes/auth.ts");

const app = new Hono();
app.route("/api/auth", auth);

beforeEach(() => {
  jest.clearAllMocks();
  mockResults.length = 0;
});

describe("POST /api/auth/register", () => {
  /** Should reject requests with missing or invalid fields. */
  it("returns 400 on invalid body", async () => {
    const res = await app.request(
      jsonRequest("POST", "/api/auth/register", { email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  /** Should reject when username is already taken in public.user. */
  it("returns 409 when username is taken", async () => {
    mockResults.push([{ "?column?": 1 }]);

    const res = await app.request(
      jsonRequest("POST", "/api/auth/register", {
        email: "test@test.com",
        password: "password123",
        username: "taken",
      }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Username already taken");
  });

  /** Should return 400 when Supabase signUp fails. */
  it("returns 400 when supabase signup fails", async () => {
    mockResults.push([]);
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email already registered" },
    });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/register", {
        email: "test@test.com",
        password: "password123",
        username: "newuser",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email already registered");
  });

  /** Should create user in both Supabase and public.user on success. */
  it("returns 201 on successful registration", async () => {
    mockResults.push([]);
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: { id: "uuid-123" },
        session: { access_token: "token-abc" },
      },
      error: null,
    });
    mockResults.push([
      {
        id: "uuid-123",
        username: "newuser",
        email: "test@test.com",
        owned_services: [],
      },
    ]);

    const res = await app.request(
      jsonRequest("POST", "/api/auth/register", {
        email: "test@test.com",
        password: "password123",
        username: "newuser",
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.username).toBe("newuser");
    expect(body.session.access_token).toBe("token-abc");
  });

  /** Should roll back Supabase user if public.user INSERT fails. */
  it("rolls back supabase user on db insert failure", async () => {
    // First call (username check) returns empty, second call (INSERT) throws
    mockResults.push([]);
    mockResults.push([]); // won't be reached — override below
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "uuid-456" }, session: null },
      error: null,
    });

    let callCount = 0;
    mockSql.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return []; // username check
      throw new Error("unique constraint"); // INSERT fails
    });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/register", {
        email: "test@test.com",
        password: "password123",
        username: "newuser",
      }),
    );
    expect(res.status).toBe(500);
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith("uuid-456");
  });
});

describe("POST /api/auth/login", () => {
  /** Should reject requests with missing fields. */
  it("returns 400 on invalid body", async () => {
    const res = await app.request(
      jsonRequest("POST", "/api/auth/login", { email: "bad" }),
    );
    expect(res.status).toBe(400);
  });

  /** Should return 401 on bad credentials. */
  it("returns 401 on failed login", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/login", {
        email: "test@test.com",
        password: "wrong",
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid login credentials");
  });

  /** Should return session and user on successful login. */
  it("returns session on successful login", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "uuid-123", email: "test@test.com" },
        session: { access_token: "token-xyz", refresh_token: "refresh-xyz" },
      },
      error: null,
    });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/login", {
        email: "test@test.com",
        password: "correct",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.access_token).toBe("token-xyz");
    expect(body.user.id).toBe("uuid-123");
  });
});

describe("POST /api/auth/signout", () => {
  /** Should return 401 when no Authorization header is provided. */
  it("returns 401 when no auth header", async () => {
    const res = await app.request(jsonRequest("POST", "/api/auth/signout"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Missing or invalid authorization header");
  });

  /** Should return 401 when token is invalid or expired. */
  it("returns 401 when token is invalid", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/signout", undefined, {
        Authorization: "Bearer bad-token",
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid token");
  });

  /** Should sign out successfully with a valid token. */
  it("returns 200 on successful signout", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "uuid-123" } },
      error: null,
    });
    mockSupabase.auth.admin.signOut.mockResolvedValue({ error: null });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/signout", undefined, {
        Authorization: "Bearer valid-token",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Signed out successfully");
    expect(mockSupabase.auth.admin.signOut).toHaveBeenCalledWith("uuid-123");
  });

  /** Should return 500 when Supabase admin signOut fails. */
  it("returns 500 when supabase signout fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "uuid-123" } },
      error: null,
    });
    mockSupabase.auth.admin.signOut.mockResolvedValue({
      error: { message: "Internal server error" },
    });

    const res = await app.request(
      jsonRequest("POST", "/api/auth/signout", undefined, {
        Authorization: "Bearer valid-token",
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
