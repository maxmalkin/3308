import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { Hono } from "hono";
import { jsonRequest } from "./helpers.ts";

const TEST_USER_ID = "test-user-id";

/** Mock database — returns configurable rows per query. */
const mockResults: Record<string, unknown>[][] = [];
const mockSql: any = Object.assign(
  jest.fn(async () => mockResults.shift() ?? []),
  {
    array: (arr: unknown[]) => arr,
    json: (obj: unknown) => obj,
  },
);

/** Mock Supabase auth client to prevent .env crashes */
const mockSupabase = {
  auth: {
    getUser: jest.fn<any>(),
  },
};

jest.unstable_mockModule("../db.ts", () => ({
  default: mockSql,
}));

jest.unstable_mockModule("../utils/supabase.ts", () => ({
  supabase: mockSupabase,
}));

/** Import router AFTER mocks are registered. */
const { default: notificationsRouter } = await import(
  "../routes/notifications.ts"
);

/**
 * Build a test app that sets userId in context (simulating auth middleware)
 * then mounts the notifications router.
 */
type AuthEnv = { Variables: { userId: string } };
const app = new Hono<AuthEnv>();
app.use("*", async (c, next) => {
  c.set("userId", TEST_USER_ID);
  await next();
});
app.route("/api/notifications", notificationsRouter);

beforeEach(() => {
  jest.clearAllMocks();
  mockResults.length = 0;
});

describe("GET /api/notifications", () => {
  it("returns a list of notifications for the user", async () => {
    // Arrange: We need TWO mock responses now!
    // First for the SELECT query, Second for the COUNT query.
    mockResults.push(
      [
        {
          id: "notif-123",
          message: "Season 2 of Severance just dropped!",
          is_read: false,
          created_at: "2026-04-06T12:00:00Z",
        },
      ],
      [{ count: "1" }], // This satisfies the new total count query
    );

    // Act: Send the GET request
    const res = await app.request(
      new Request("http://localhost/api/notifications"),
    );

    // Assert: Check the response
    expect(res.status).toBe(200);
    const body = await res.json();

    // Check our array length and message
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].message).toBe(
      "Season 2 of Severance just dropped!",
    );

    // Check that our new pagination object works!
    expect(body.pagination.total).toBe(1);
  });
});

describe("PATCH /api/notifications/:id/read", () => {
  it("marks a notification as read", async () => {
    // Arrange: Mock the database returning the updated row
    mockResults.push([
      {
        id: "notif-123",
        message: "Season 2 of Severance just dropped!",
        is_read: true, // Now it's read!
      },
    ]);

    // Act: Send the PATCH request
    const res = await app.request(
      jsonRequest("PATCH", "/api/notifications/notif-123/read"),
    );

    // Assert: Check the response
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notification.is_read).toBe(true);
  });

  it("returns 404 if the notification doesn't exist", async () => {
    // Arrange: Mock the database returning an empty array (no rows updated)
    mockResults.push([]);

    // Act: Send the PATCH request
    const res = await app.request(
      jsonRequest("PATCH", "/api/notifications/fake-id/read"),
    );

    // Assert
    expect(res.status).toBe(404);
  });
});
