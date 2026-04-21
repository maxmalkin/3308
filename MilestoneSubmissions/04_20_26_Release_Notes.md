# 04-20-26 Release Notes

Release `0.2.0` — major UI overhaul, semantic search, server components, and recommendation tightening.

## What's Changed

### Changes

- Lazy Loading by @maxmalkin in https://github.com/maxmalkin/3308/pull/144
- UI to server by @mkuoch in https://github.com/maxmalkin/3308/pull/141
- Live link in README by @maxmalkin in https://github.com/maxmalkin/3308/pull/140
- Embedding (and some workflow stuff) by @maxmalkin in https://github.com/maxmalkin/3308/pull/139
- UI Stuff by @maxmalkin in https://github.com/maxmalkin/3308/pull/131

**Full Changelog**: https://github.com/maxmalkin/3308/compare/0.1.1...0.2.0

## Additional Information

- **Editorial frontend redesign**: cream/oat/ink palette, Fraunces + Geist + JetBrains Mono fonts, italic-emphasis headlines across the app. Logged-in and logged-out home pages, refreshed `/queue`, `/log`, `/recommendations`, `/login`, `/register`, and `/shows/[id]`.
- **Unified login/signup** at `/login` and `/register` sharing a centered `AuthForm` with pill-tab switcher. Signup includes a streaming-services chip picker (Apple TV, Prime Video, Paramount, Netflix, HBO Max, Disney+, Peacock).
- **Semantic search** powered by Gemini embeddings: navbar dropdown (top 5 with poster previews) and a dedicated `/search` results page (40-per-page infinite scroll, sort by relevance / rating / newest / A–Z).
- **Show detail page**: poster + tracker action bar (Add to queue / Watching / Mark watched), 4-cell stats strip, overview, last-aired episode + seasons grid, next-up card, cast, genres, networks, watch providers, and a "If you liked this" rail driven by vector similarity.
- **New endpoints**:
  - `GET /api/shows/showcase` (public, randomized popular)
  - `GET /api/shows/:id/related` (vector similarity, public)
  - `GET /api/user/shows/:id` (single-show status lookup)
  - `/api/shows/search` is now public with optional auth for personalization
  - `/api/shows/recommendations` falls back to randomized popular shows for new users
- **Recommendation tightening**: results now require at least one streaming provider that matches the user's owned services. Networks (broadcaster) no longer count; shows with no flatrate provider are excluded. Pool size raised to 60 results.
- **Performance**:
  - `/shows/[id]` and `/search` converted to React Server Components with parallel fetching of show + related shows
  - Module-level SWR cache in `useApiResource` (60s TTL, in-flight dedupe, prefix invalidation on mutations)
  - Server-side Gemini embedding LRU cache (500 entries, 10 min TTL)
  - Showcase endpoint cache headers (`s-maxage=60, stale-while-revalidate=300`)
  - TMDB images marked `unoptimized` so Next.js stops re-encoding the CDN
  - Single-show status endpoint replaces previous full-watchlist + full-log fetch in the action bar
  - Custom thin scrollbars matching the page palette
- **Boneyard skeleton** loading wired into home, search, and show detail.
- **Tests**: 68 client tests + 72 server tests passing (140 total).
