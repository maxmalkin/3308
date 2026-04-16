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
            WHERE p->>'provider_name' = ANY(${owned}::text[])
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
    return c.json({
      results: [],
      message: "Add shows to your list to get recommendations",
    });
  }

  const excludeIds = userShowRows.map((r) => r.id as number);

  const [avgRow] = await sql`
    SELECT AVG(embedding)::vector AS avg_embedding
    FROM public.shows
    WHERE id = ANY(${excludeIds}::int[]) AND embedding IS NOT NULL
  `;

  const avgVec = avgRow?.avg_embedding as string | null;
  if (!avgVec) return c.json({ results: [] });

  const results = await sql`
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
          WHERE p->>'provider_name' = ANY(${owned}::text[])
        )
      )
    ORDER BY s.embedding <=> ${avgVec}::vector
    LIMIT ${RECOMMENDATION_LIMIT}
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
