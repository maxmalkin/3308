/**
 * @file Unit tests for the /api/shows routes (search and detail).
 * Mocks the TMDB utility functions to test route logic without external API calls.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Hono } from "hono";
import { sampleShow } from "./helpers.ts";

/** Mock TMDB utility functions. */
// biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
const mockSearchTMDB = jest.fn<any>();
// biome-ignore lint/suspicious/noExplicitAny: mock needs flexible typing
const mockFetchAndCacheShow = jest.fn<any>();

jest.unstable_mockModule("../utils/tmdb.ts", () => ({
  searchTMDB: mockSearchTMDB,
  fetchAndCacheShow: mockFetchAndCacheShow,
}));

/** Import show routes AFTER mocks are registered. */
const { default: shows } = await import("../routes/shows.ts");

const app = new Hono();
app.route("/api/shows", shows);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/shows/search", () => {
  /** Should reject requests missing the required query parameter. */
  it("returns 400 when query param is missing", async () => {
    const res = await app.request(
      new Request("http://localhost/api/shows/search"),
    );
    expect(res.status).toBe(400);
  });

  /** Should proxy TMDB search results to the client. */
  it("returns TMDB search results", async () => {
    const tmdbResponse = {
      page: 1,
      results: [sampleShow],
      total_pages: 1,
      total_results: 1,
    };
    mockSearchTMDB.mockResolvedValue(tmdbResponse);

    const res = await app.request(
      new Request(
        "http://localhost/api/shows/search?query=breaking+bad&page=1",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Breaking Bad");
    expect(mockSearchTMDB).toHaveBeenCalledWith("breaking bad", 1);
  });

  /** Should default to page 1 when page param is omitted. */
  it("defaults to page 1", async () => {
    mockSearchTMDB.mockResolvedValue({ page: 1, results: [] });

    await app.request(
      new Request("http://localhost/api/shows/search?query=test"),
    );
    expect(mockSearchTMDB).toHaveBeenCalledWith("test", 1);
  });

  /** Should return 502 when the TMDB API call fails. */
  it("returns 502 when TMDB fails", async () => {
    mockSearchTMDB.mockRejectedValue(new Error("TMDB down"));

    const res = await app.request(
      new Request("http://localhost/api/shows/search?query=test"),
    );
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch from TMDB");
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
