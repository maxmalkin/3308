/**
 * @file Test helper utilities for building Hono test apps and making requests.
 * Provides factory functions and sample data used across all test suites.
 */

/** Sample TMDB TV show data matching the API response shape. */
export const sampleShow = {
  id: 1396,
  name: "Breaking Bad",
  original_name: "Breaking Bad",
  overview: "A chemistry teacher diagnosed with cancer.",
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  first_air_date: "2008-01-20",
  last_air_date: "2013-09-29",
  popularity: 100.5,
  vote_average: 8.9,
  vote_count: 5000,
  adult: false,
  original_language: "en",
  origin_country: ["US"],
  genre_ids: [18, 80],
  status: "Ended",
  type: "Scripted",
  number_of_seasons: 5,
  number_of_episodes: 62,
  in_production: false,
  homepage: "https://www.amc.com/shows/breaking-bad",
  tagline: "All Hail the King",
  episode_run_time: [45],
  languages: ["en"],
  genres: [
    { id: 18, name: "Drama" },
    { id: 80, name: "Crime" },
  ],
  created_by: [{ id: 66633, name: "Vince Gilligan" }],
  networks: [{ id: 174, name: "AMC" }],
  production_companies: [],
  production_countries: [{ iso_3166_1: "US", name: "United States" }],
  seasons: [],
  spoken_languages: [{ iso_639_1: "en", name: "English" }],
  last_episode_to_air: null,
  next_episode_to_air: null,
};

/** Sample user_shows join table row. */
export const sampleUserShowEntry = {
  user_id: "test-user-id",
  show_id: 1396,
  status: "Want to Watch",
  added_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

/**
 * Builds a JSON Request object for use with Hono's `app.request()`.
 * @param method - HTTP method (GET, POST, PATCH, DELETE)
 * @param path - Request path (e.g. "/api/auth/login")
 * @param body - Optional JSON body
 * @param headers - Optional extra headers
 * @returns A Request instance ready for `app.request()`
 */
export function jsonRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Request {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body) init.body = JSON.stringify(body);
  return new Request(`http://localhost${path}`, init);
}
