/**
 * @file Unit tests for the /api/shows routes (search, recommendations, detail).
 * Mocks TMDB, Gemini, and the database to test route logic in isolation.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Hono } from "hono";
import { sampleShow } from "./helpers.ts";

const TEST_USER_ID = "test-user-id";

/** Mock database — returns configurable rows per query. */
const mockResults: Record<string, unknown>[][] = [];
// biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
const mockSql: any = Object.assign(
  jest.fn(async () => mockResults.shift() ?? []),
  {
    array: (arr: unknown[]) => arr,
    json: (obj: unknown) => obj,
  },
);

/** Mock TMDB utility functions. */
// biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
const mockSearchTMDB = jest.fn<any>();
// biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
const mockFetchAndCacheShow = jest.fn<any>();

/** Mock Gemini embedding. */
// biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
const mockEmbedText = jest.fn<any>();

jest.unstable_mockModule("../db.ts", () => ({
  default: mockSql,
}));

jest.unstable_mockModule("../utils/tmdb.ts", () => ({
  searchTMDB: mockSearchTMDB,
  fetchAndCacheShow: mockFetchAndCacheShow,
}));

jest.unstable_mockModule("../utils/gemini.ts", () => ({
  embedText: mockEmbedText,
  toPgVector: (values: number[]) => `[${values.join(",")}]`,
}));

/** Import show routes AFTER mocks are registered. */
const { default: shows } = await import("../routes/shows.ts");

type AuthEnv = { Variables: { userId: string } };
const app = new Hono<AuthEnv>();
app.use("/api/shows/search", async (c, next) => {
  c.set("userId", TEST_USER_ID);
  await next();
});
app.use("/api/shows/recommendations", async (c, next) => {
  c.set("userId", TEST_USER_ID);
  await next();
});
app.route("/api/shows", shows);

beforeEach(() => {
  jest.clearAllMocks();
  mockResults.length = 0;
  mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3]);
});

describe("GET /api/shows/search", () => {
  /** Should reject requests missing the required query parameter. */
  it("returns 400 when query param is missing", async () => {
    const res = await app.request(
      new Request("http://localhost/api/shows/search"),
    );
    expect(res.status).toBe(400);
  });

  /** Should return semantic results from the DB when embeddings match. */
  it("returns semantic results when cached shows match", async () => {
    // 1st sql call: owned_services lookup
    mockResults.push([{ owned_services: [] }]);
    // 2nd sql call: semantic search results
    mockResults.push([{ ...sampleShow, distance: 0.1 }]);

    const res = await app.request(
      new Request(
        "http://localhost/api/shows/search?query=breaking+bad&page=1",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("semantic");
    expect(body.results).toHaveLength(1);
    expect(body.results[0].name).toBe("Breaking Bad");
    expect(mockSearchTMDB).not.toHaveBeenCalled();
  });

  /** Should fall back to TMDB when no semantic results exist. */
  it("falls back to TMDB when no semantic results", async () => {
    mockResults.push([{ owned_services: [] }]);
    mockResults.push([]);
    mockSearchTMDB.mockResolvedValue({ page: 1, results: [sampleShow] });

    const res = await app.request(
      new Request(
        "http://localhost/api/shows/search?query=breaking+bad&page=1",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("tmdb");
    expect(body.results).toHaveLength(1);
    expect(mockSearchTMDB).toHaveBeenCalledWith("breaking bad", 1);
  });

  /** Should fall back to TMDB with page 1 by default. */
  it("defaults to page 1 on TMDB fallback", async () => {
    mockResults.push([{ owned_services: [] }]);
    mockResults.push([]);
    mockSearchTMDB.mockResolvedValue({ page: 1, results: [] });

    await app.request(
      new Request("http://localhost/api/shows/search?query=test"),
    );
    expect(mockSearchTMDB).toHaveBeenCalledWith("test", 1);
  });

  /** Should still fall back to TMDB when embedding fails. */
  it("falls back to TMDB when embedding fails", async () => {
    mockEmbedText.mockRejectedValue(new Error("Gemini down"));
    mockResults.push([{ owned_services: [] }]);
    mockSearchTMDB.mockResolvedValue({ page: 1, results: [sampleShow] });

    const res = await app.request(
      new Request("http://localhost/api/shows/search?query=test"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("tmdb");
  });

  /** Should return 502 when the TMDB fallback fails. */
  it("returns 502 when semantic is empty and TMDB fails", async () => {
    mockResults.push([{ owned_services: [] }]);
    mockResults.push([]);
    mockSearchTMDB.mockRejectedValue(new Error("TMDB down"));

    const res = await app.request(
      new Request("http://localhost/api/shows/search?query=test"),
    );
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch from TMDB");
  });
});

describe("GET /api/shows/recommendations", () => {
  /** Should fall back to popular shows when user has no shows. */
  it("returns popular shows when user has no shows", async () => {
    // owned_services, user_shows lookup, popular fallback
    mockResults.push([{ owned_services: [] }]);
    mockResults.push([]);
    mockResults.push([sampleShow]);

    const res = await app.request(
      new Request("http://localhost/api/shows/recommendations"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("popular");
    expect(body.results).toHaveLength(1);
    expect(body.results[0].name).toBe("Breaking Bad");
  });

  /** Should return nearest shows when the user has a watchlist. */
  it("returns nearest shows based on user's embeddings", async () => {
    mockResults.push([{ owned_services: [] }]);
    mockResults.push([{ id: 1, embedding: "[0.1,0.2]" }]);
    mockResults.push([{ avg_embedding: "[0.1,0.2]" }]);
    mockResults.push([{ ...sampleShow, distance: 0.05 }]);

    const res = await app.request(
      new Request("http://localhost/api/shows/recommendations"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].name).toBe("Breaking Bad");
  });
});

describe("GET /api/shows/:id", () => {
  /** Should return show data when found (cached or fetched). */
  it("returns show by id", async () => {
    mockFetchAndCacheShow.mockResolvedValue(sampleShow);

    const res = await app.request(
      new Request("http://localhost/api/shows/1396"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.show.id).toBe(1396);
    expect(body.show.name).toBe("Breaking Bad");
  });

  /** Should return 404 when the show doesn't exist on TMDB. */
  it("returns 404 when show not found", async () => {
    mockFetchAndCacheShow.mockResolvedValue(null);

    const res = await app.request(
      new Request("http://localhost/api/shows/999999"),
    );
    expect(res.status).toBe(404);
  });

  /** Should reject non-numeric or invalid id params. */
  it("returns 400 on invalid id", async () => {
    const res = await app.request(
      new Request("http://localhost/api/shows/abc"),
    );
    expect(res.status).toBe(400);
  });

  /** Should return 502 when TMDB fetch throws. */
  it("returns 502 when TMDB fetch fails", async () => {
    mockFetchAndCacheShow.mockRejectedValue(new Error("TMDB error"));

    const res = await app.request(
      new Request("http://localhost/api/shows/1396"),
    );
    expect(res.status).toBe(502);
  });
});
