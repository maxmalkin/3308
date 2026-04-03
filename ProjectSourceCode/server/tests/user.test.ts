/**
 * @file Unit tests for the /api/user routes (watchlist, log, show CRUD).
 * Tests the protected user routes with a pre-set userId context (bypassing JWT middleware).
 * Mocks the database and TMDB utility to test route logic in isolation.
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { Hono } from "hono";
import { jsonRequest, sampleShow, sampleUserShowEntry } from "./helpers.ts";

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

/** Mock TMDB fetch-and-cache function. */
const mockFetchAndCacheShow = jest.fn<any>();

jest.unstable_mockModule("../db.ts", () => ({
  default: mockSql,
}));

jest.unstable_mockModule("../utils/tmdb.ts", () => ({
  fetchAndCacheShow: mockFetchAndCacheShow,
}));

/** Import user routes AFTER mocks are registered. */
const { default: userRouter } = await import("../routes/user.ts");

/**
 * Build a test app that sets userId in context (simulating auth middleware)
 * then mounts the user router.
 */
type AuthEnv = { Variables: { userId: string } };
const app = new Hono<AuthEnv>();
app.use("*", async (c, next) => {
  c.set("userId", TEST_USER_ID);
  await next();
});
app.route("/api/user", userRouter);

beforeEach(() => {
  jest.clearAllMocks();
  mockResults.length = 0;
});

describe("GET /api/user/watchlist", () => {
  /** Should return shows with "Want to Watch" status for the authenticated user. */
  it("returns watchlist shows", async () => {
    mockResults.push([{ ...sampleUserShowEntry, ...sampleShow }]);

    const res = await app.request(
      new Request("http://localhost/api/user/watchlist"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shows).toHaveLength(1);
    expect(body.shows[0].name).toBe("Breaking Bad");
  });

  /** Should return empty array when user has no watchlist items. */
  it("returns empty array when no shows", async () => {
    mockResults.push([]);

    const res = await app.request(
      new Request("http://localhost/api/user/watchlist"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shows).toHaveLength(0);
  });
});

describe("GET /api/user/log", () => {
  /** Should return shows with "Watched" or "In Progress" status. */
  it("returns log shows", async () => {
    mockResults.push([
      { ...sampleUserShowEntry, ...sampleShow, status: "Watched" },
    ]);

    const res = await app.request(
      new Request("http://localhost/api/user/log"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shows).toHaveLength(1);
    expect(body.shows[0].status).toBe("Watched");
  });
});

describe("POST /api/user/shows", () => {
  /** Should reject invalid request bodies. */
  it("returns 400 on invalid body", async () => {
    const res = await app.request(
      jsonRequest("POST", "/api/user/shows", { show_id: "not-a-number" }),
    );
    expect(res.status).toBe(400);
  });

  /** Should return 404 when the show doesn't exist on TMDB. */
  it("returns 404 when show not found on TMDB", async () => {
    mockFetchAndCacheShow.mockResolvedValue(null);

    const res = await app.request(
      jsonRequest("POST", "/api/user/shows", { show_id: 999999 }),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Show not found on TMDB");
  });

  /** Should return 502 when the TMDB fetch fails. */
  it("returns 502 when TMDB fetch fails", async () => {
    mockFetchAndCacheShow.mockRejectedValue(new Error("TMDB down"));

    const res = await app.request(
      jsonRequest("POST", "/api/user/shows", { show_id: 1396 }),
    );
    expect(res.status).toBe(502);
  });

  /** Should return 409 when the show is already on the user's list. */
  it("returns 409 when show already on list", async () => {
    mockFetchAndCacheShow.mockResolvedValue(sampleShow);
    mockResults.push([{ "?column?": 1 }]);

    const res = await app.request(
      jsonRequest("POST", "/api/user/shows", { show_id: 1396 }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Show already on list");
  });

  /** Should create entry and return 201 on success. */
  it("returns 201 on successful add", async () => {
    mockFetchAndCacheShow.mockResolvedValue(sampleShow);
    mockResults.push([]);
    mockResults.push([sampleUserShowEntry]);

    const res = await app.request(
      jsonRequest("POST", "/api/user/shows", {
        show_id: 1396,
        status: "Want to Watch",
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.entry.show_id).toBe(1396);
  });

  /** Should default status to "Want to Watch" when not provided. */
  it("defaults status to Want to Watch", async () => {
    mockFetchAndCacheShow.mockResolvedValue(sampleShow);
    mockResults.push([]);
    mockResults.push([sampleUserShowEntry]);

    const res = await app.request(
      jsonRequest("POST", "/api/user/shows", { show_id: 1396 }),
    );
    expect(res.status).toBe(201);
  });
});

describe("PATCH /api/user/shows/:showId", () => {
  /** Should reject invalid status values. */
  it("returns 400 on invalid status", async () => {
    const res = await app.request(
      jsonRequest("PATCH", "/api/user/shows/1396", { status: "Invalid" }),
    );
    expect(res.status).toBe(400);
  });

  /** Should return 404 when the entry doesn't exist. */
  it("returns 404 when entry not found", async () => {
    mockResults.push([]);

    const res = await app.request(
      jsonRequest("PATCH", "/api/user/shows/1396", { status: "Watched" }),
    );
    expect(res.status).toBe(404);
  });

  /** Should update the status and return the updated entry. */
  it("updates status successfully", async () => {
    mockResults.push([{ ...sampleUserShowEntry, status: "Watched" }]);

    const res = await app.request(
      jsonRequest("PATCH", "/api/user/shows/1396", { status: "Watched" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entry.status).toBe("Watched");
  });
});

describe("DELETE /api/user/shows/:showId", () => {
  /** Should return 404 when the entry doesn't exist. */
  it("returns 404 when entry not found", async () => {
    mockResults.push([]);

    const res = await app.request(
      new Request("http://localhost/api/user/shows/1396", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(404);
  });

  /** Should delete the entry and confirm removal. */
  it("deletes entry successfully", async () => {
    mockResults.push([sampleUserShowEntry]);

    const res = await app.request(
      new Request("http://localhost/api/user/shows/1396", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
  });
});
