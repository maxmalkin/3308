import { Hono } from "hono";
import z from "zod";
import { ShowSearchQuerySchema, ShowIdParamSchema } from "../types/shows.ts";
import { searchTMDB, fetchAndCacheShow } from "../utils/tmdb.ts";

const shows = new Hono();

shows.get("/search", async (c) => {
  const parsed = ShowSearchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { query, page } = parsed.data;

  try {
    const data = await searchTMDB(query, page);
    return c.json(data);
  } catch {
    return c.json({ error: "Failed to fetch from TMDB" }, 502);
  }
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
