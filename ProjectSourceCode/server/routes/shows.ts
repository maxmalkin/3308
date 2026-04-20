import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { embedText, toPgVector } from "../utils/gemini.ts";
import { fetchAndCacheShow, searchTMDB } from "../utils/tmdb.ts";
import {
  ShowIdParamSchema,
  ShowSearchQuerySchema,
} from "../validators/shows.ts";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

const shows = new Hono<AuthEnv>();

const SEMANTIC_LIMIT = 20;
const RECOMMENDATION_LIMIT = 20;

async function getOwnedServices(userId: string): Promise<string[]> {
  const [row] = await sql`
    SELECT owned_services FROM public."user" WHERE id = ${userId}
  `;
  return (row?.owned_services as string[] | undefined) ?? [];
}

function ownedLikePatterns(owned: string[]): string[] {
  return owned.map((s) => `%${s.replace(/\+/g, "")}%`);
}

shows.get("/search", async (c) => {
  const parsed = ShowSearchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const userId = c.get("userId");
  const { query, page } = parsed.data;

  let queryVec: string | null = null;
  try {
    queryVec = toPgVector(await embedText(query));
  } catch (err) {
    console.error("Embedding query failed:", err);
  }

  const owned = await getOwnedServices(userId);
  const hasOwnedFilter = owned.length > 0;

  let semanticResults: Array<Record<string, unknown>> = [];
  if (queryVec) {
    semanticResults = await sql`
      SELECT
        s.*,
        us.status AS user_status,
        (s.embedding <=> ${queryVec}::vector) AS distance
      FROM public.shows s
      LEFT JOIN public.user_shows us
        ON us.show_id = s.id AND us.user_id = ${userId}
      WHERE s.embedding IS NOT NULL
        AND (
          ${!hasOwnedFilter}::boolean
          OR s.watch_providers_us IS NULL
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(s.watch_providers_us->'flatrate', '[]'::jsonb)
            ) p
            WHERE p->>'provider_name' ILIKE ANY(${ownedLikePatterns(owned)}::text[])
          )
        )
      ORDER BY
        CASE
          WHEN us.status IN ('Watched', 'Want to Watch') THEN 1
          ELSE 0
        END,
        s.embedding <=> ${queryVec}::vector
      LIMIT ${SEMANTIC_LIMIT}
    `;
  }

  if (semanticResults.length > 0) {
    return c.json({ results: semanticResults, source: "semantic" });
  }

  try {
    const data = await searchTMDB(query, page);
    return c.json({ results: data.results, source: "tmdb" });
  } catch {
    return c.json({ error: "Failed to fetch from TMDB" }, 502);
  }
});

shows.get("/recommendations", async (c) => {
  const userId = c.get("userId");
  const owned = await getOwnedServices(userId);
  const hasOwnedFilter = owned.length > 0;

  const userShowRows = await sql`
    SELECT s.id, s.embedding
    FROM public.user_shows us
    JOIN public.shows s ON s.id = us.show_id
    WHERE us.user_id = ${userId}
      AND s.embedding IS NOT NULL
  `;

  if (userShowRows.length === 0) {
    let fallback = await sql`
      SELECT * FROM (
        SELECT
          s.id, s.name, s.original_name, s.overview, s.poster_path,
          s.backdrop_path, s.first_air_date, s.vote_average, s.genres,
          s.networks, s.watch_providers_us
        FROM public.shows s
        WHERE s.poster_path IS NOT NULL
          AND (
            ${!hasOwnedFilter}::boolean
            OR s.watch_providers_us IS NULL
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                COALESCE(s.watch_providers_us->'flatrate', '[]'::jsonb)
              ) p
              WHERE p->>'provider_name' ILIKE ANY(${ownedLikePatterns(owned)}::text[])
            )
          )
        ORDER BY popularity DESC NULLS LAST
        LIMIT 100
      ) pool
      ORDER BY random()
      LIMIT ${RECOMMENDATION_LIMIT}
    `;
    if (fallback.length === 0) {
      fallback = await sql`
        SELECT * FROM (
          SELECT
            s.id, s.name, s.original_name, s.overview, s.poster_path,
            s.backdrop_path, s.first_air_date, s.vote_average, s.genres,
            s.networks, s.watch_providers_us
          FROM public.shows s
          WHERE s.poster_path IS NOT NULL
          ORDER BY popularity DESC NULLS LAST
          LIMIT 100
        ) pool
        ORDER BY random()
        LIMIT ${RECOMMENDATION_LIMIT}
      `;
    }
    return c.json({ results: fallback, source: "popular" });
  }

  const excludeIds = userShowRows.map((r) => r.id as number);

  const [avgRow] = await sql`
    SELECT AVG(embedding)::vector AS avg_embedding
    FROM public.shows
    WHERE id = ANY(${excludeIds}::int[]) AND embedding IS NOT NULL
  `;

  const avgVec = avgRow?.avg_embedding as string | null;

  let results: Array<Record<string, unknown>> = [];
  if (avgVec) {
    results = await sql`
      SELECT
        s.*,
        (s.embedding <=> ${avgVec}::vector) AS distance
      FROM public.shows s
      WHERE s.embedding IS NOT NULL
        AND NOT (s.id = ANY(${excludeIds}::int[]))
        AND (
          ${!hasOwnedFilter}::boolean
          OR s.watch_providers_us IS NULL
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(s.watch_providers_us->'flatrate', '[]'::jsonb)
            ) p
            WHERE p->>'provider_name' ILIKE ANY(${ownedLikePatterns(owned)}::text[])
          )
        )
      ORDER BY s.embedding <=> ${avgVec}::vector
      LIMIT ${RECOMMENDATION_LIMIT}
    `;
  }

  if (results.length > 0) {
    return c.json({ results, source: "embedding" });
  }

  const popular = await sql`
    SELECT * FROM (
      SELECT
        s.id, s.name, s.original_name, s.overview, s.poster_path,
        s.backdrop_path, s.first_air_date, s.vote_average, s.genres,
        s.networks, s.watch_providers_us
      FROM public.shows s
      WHERE s.poster_path IS NOT NULL
        AND NOT (s.id = ANY(${excludeIds}::int[]))
      ORDER BY popularity DESC NULLS LAST
      LIMIT 100
    ) pool
    ORDER BY random()
    LIMIT ${RECOMMENDATION_LIMIT}
  `;
  return c.json({ results: popular, source: "popular" });
});

shows.get("/showcase", async (c) => {
  const limitParam = Number(c.req.query("limit") ?? 24);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), 60)
    : 24;
  const random = c.req.query("random") !== "false";
  const poolSize = Math.max(limit * 4, 100);

  const results = random
    ? await sql`
        SELECT * FROM (
          SELECT
            id, name, original_name, overview, poster_path, backdrop_path,
            first_air_date, vote_average, genres, networks, watch_providers_us
          FROM public.shows
          WHERE poster_path IS NOT NULL
          ORDER BY popularity DESC NULLS LAST
          LIMIT ${poolSize}
        ) pool
        ORDER BY random()
        LIMIT ${limit}
      `
    : await sql`
        SELECT
          id, name, original_name, overview, poster_path, backdrop_path,
          first_air_date, vote_average, genres, networks, watch_providers_us
        FROM public.shows
        WHERE poster_path IS NOT NULL
        ORDER BY popularity DESC NULLS LAST
        LIMIT ${limit}
      `;

  c.header("Cache-Control", "no-store");
  return c.json({ results });
});

shows.get("/:id/related", async (c) => {
  const parsed = ShowIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }
  const limitParam = Number(c.req.query("limit") ?? 8);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), 24)
    : 8;

  const [base] = await sql`
    SELECT embedding FROM public.shows WHERE id = ${parsed.data.id}
  `;
  const baseVec = base?.embedding as string | null;
  if (!baseVec) return c.json({ results: [] });

  const results = await sql`
    SELECT
      s.id, s.name, s.original_name, s.poster_path, s.backdrop_path,
      s.first_air_date, s.vote_average, s.genres, s.networks,
      s.watch_providers_us,
      (s.embedding <=> ${baseVec}::vector) AS distance
    FROM public.shows s
    WHERE s.embedding IS NOT NULL
      AND s.id <> ${parsed.data.id}
    ORDER BY s.embedding <=> ${baseVec}::vector
    LIMIT ${limit}
  `;
  return c.json({ results });
});

shows.get("/:id", async (c) => {
  const parsed = ShowIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  try {
    const show = await fetchAndCacheShow(parsed.data.id);
    if (!show) return c.json({ error: "Show not found" }, 404);
    return c.json({ show });
  } catch {
    return c.json({ error: "Failed to fetch from TMDB" }, 502);
  }
});

export default shows;
