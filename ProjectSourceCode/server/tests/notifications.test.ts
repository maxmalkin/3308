import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Hono } from "hono";
import { jsonRequest } from "./helpers.ts";

const TEST_USER_ID = "test-user-id";

/** Mock database — returns configurable rows per query. */
const mockResults: Record<string, unknown>[][] = [];
const mockSql = Object.assign(
  jest.fn(async () => mockResults.shift() ?? []),
  {
    array: (arr: unknown[]) => arr,
    json: (obj: unknown) => obj,
  },
);

/** Mock Supabase auth client to prevent .env crashes */
const mockSupabase = {
  auth: {
    getUser: jest.fn<() => Promise<unknown>>(),
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
    // Arrange: three mock results — SELECT, COUNT, unread COUNT
    mockResults.push(
      [
        {
          id: "notif-123",
          message: "Season 2 of Severance just dropped!",
          is_read: false,
          created_at: "2026-04-06T12:00:00Z",
        },
      ],
      [{ count: "1" }],
      [{ count: "1" }],
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
    expect(body.unreadCount).toBe(1);
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
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

describe("POST /api/notifications/mark-all-read", () => {
  it("marks every unread notification for the user as read", async () => {
    mockResults.push([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const res = await app.request(
      jsonRequest("POST", "/api/notifications/mark-all-read"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(3);
  });
});

describe("DELETE /api/notifications/:id", () => {
  it("returns 200 when a notification is deleted", async () => {
    mockResults.push([{ id: "notif-123" }]);
    const res = await app.request(
      jsonRequest("DELETE", "/api/notifications/notif-123"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
  });

  it("returns 404 when the notification does not belong to the user", async () => {
    mockResults.push([]);
    const res = await app.request(
      jsonRequest("DELETE", "/api/notifications/notif-missing"),
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/notifications", () => {
  it("clears all notifications for the user", async () => {
    mockResults.push([{ id: "a" }, { id: "b" }]);
    const res = await app.request(jsonRequest("DELETE", "/api/notifications"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(2);
  });
});

describe("GET /api/notifications/settings", () => {
  it("returns existing settings when present", async () => {
    mockResults.push([
      {
        user_id: TEST_USER_ID,
        episode_alerts: true,
        reply_alerts: false,
        updated_at: "2026-04-22T00:00:00Z",
      },
    ]);
    const res = await app.request(
      new Request("http://localhost/api/notifications/settings"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.episode_alerts).toBe(true);
    expect(body.settings.reply_alerts).toBe(false);
  });

  it("creates default settings when none exist", async () => {
    mockResults.push(
      [],
      [
        {
          user_id: TEST_USER_ID,
          episode_alerts: true,
          reply_alerts: true,
          updated_at: "2026-04-22T00:00:00Z",
        },
      ],
    );
    const res = await app.request(
      new Request("http://localhost/api/notifications/settings"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.episode_alerts).toBe(true);
    expect(body.settings.reply_alerts).toBe(true);
  });
});

describe("PATCH /api/notifications/settings", () => {
  it("upserts notification preferences", async () => {
    mockResults.push([
      {
        user_id: TEST_USER_ID,
        episode_alerts: false,
        reply_alerts: true,
        updated_at: "2026-04-22T00:00:00Z",
      },
    ]);

    const res = await app.request(
      jsonRequest("PATCH", "/api/notifications/settings", {
        episode_alerts: false,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.episode_alerts).toBe(false);
  });

  it("rejects empty payloads with a 400", async () => {
    const res = await app.request(
      jsonRequest("PATCH", "/api/notifications/settings", {}),
    );
    expect(res.status).toBe(400);
  });
});
