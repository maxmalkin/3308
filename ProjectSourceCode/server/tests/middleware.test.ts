/**
 * @file Unit tests for the auth middleware.
 * Verifies JWT token validation and rejection of unauthenticated requests.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Hono } from "hono";

/** Mock Supabase auth client. */
const mockSupabase = {
  auth: {
    // biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
    getUser: jest.fn<any>(),
  },
};

jest.unstable_mockModule("../utils/supabase.ts", () => ({
  supabase: mockSupabase,
}));

/** Import middleware AFTER mocks are registered. */
const { authMiddleware } = await import("../middleware/auth.ts");

/** Test app with auth middleware protecting a simple echo endpoint. */
type AuthEnv = { Variables: { userId: string } };
const app = new Hono<AuthEnv>();
app.use("*", authMiddleware);
app.get("/protected", (c) => {
  return c.json({ userId: c.get("userId") });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authMiddleware", () => {
  /** Should reject requests with no Authorization header. */
  it("returns 401 when no auth header", async () => {
    const res = await app.request(new Request("http://localhost/protected"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Missing or invalid Authorization header");
  });

  /** Should reject requests with malformed Authorization header. */
  it("returns 401 when auth header is not Bearer", async () => {
    const res = await app.request(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Basic abc123" },
      }),
    );
    expect(res.status).toBe(401);
  });

  /** Should reject expired or invalid tokens. */
  it("returns 401 when token is invalid", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const res = await app.request(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer invalid-token" },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired token");
  });

  /** Should pass through and set userId when token is valid. */
  it("sets userId and passes through on valid token", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "uuid-123" } },
      error: null,
    });

    const res = await app.request(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer valid-token" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("uuid-123");
  });
});
