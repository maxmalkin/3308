import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import {
  AddUserShowBodySchema,
  UpdateUserShowBodySchema,
} from "../types/userShows.ts";
import { fetchAndCacheShow } from "../utils/tmdb.ts";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

const user = new Hono<AuthEnv>();

user.get("/watchlist", async (c) => {
  const userId = c.get("userId");
  const rows = await sql`
    SELECT us.status, us.added_at, us.updated_at, s.*
    FROM public.user_shows us
    JOIN public.shows s ON s.id = us.show_id
    WHERE us.user_id = ${userId}
      AND us.status = 'Want to Watch'
    ORDER BY us.updated_at DESC
  `;
  return c.json({ shows: rows });
});

user.get("/log", async (c) => {
  const userId = c.get("userId");
  const rows = await sql`
    SELECT us.status, us.added_at, us.updated_at, s.*
    FROM public.user_shows us
    JOIN public.shows s ON s.id = us.show_id
    WHERE us.user_id = ${userId}
      AND us.status IN ('Watched', 'In Progress')
    ORDER BY us.updated_at DESC
  `;
  return c.json({ shows: rows });
});

user.post("/shows", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = AddUserShowBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { show_id, status } = parsed.data;

  try {
    const show = await fetchAndCacheShow(show_id);
    if (!show) return c.json({ error: "Show not found on TMDB" }, 404);
  } catch {
    return c.json({ error: "Failed to fetch show from TMDB" }, 502);
  }

  const existing = await sql`
    SELECT 1 FROM public.user_shows
    WHERE user_id = ${userId} AND show_id = ${show_id}
  `;
  if (existing.length > 0) {
    return c.json({ error: "Show already on list" }, 409);
  }

  const [entry] = await sql`
    INSERT INTO public.user_shows (user_id, show_id, status)
    VALUES (${userId}, ${show_id}, ${status})
    RETURNING *
  `;

  return c.json({ entry }, 201);
});

user.patch("/shows/:showId", async (c) => {
  const userId = c.get("userId");
  const showId = Number(c.req.param("showId"));
  const body = await c.req.json();
  const parsed = UpdateUserShowBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { status } = parsed.data;

  const [entry] = await sql`
    UPDATE public.user_shows
    SET status = ${status}, updated_at = NOW()
    WHERE user_id = ${userId} AND show_id = ${showId}
    RETURNING *
  `;

  if (!entry) return c.json({ error: "Entry not found" }, 404);
  return c.json({ entry });
});

user.delete("/shows/:showId", async (c) => {
  const userId = c.get("userId");
  const showId = Number(c.req.param("showId"));

  const [entry] = await sql`
    DELETE FROM public.user_shows
    WHERE user_id = ${userId} AND show_id = ${showId}
    RETURNING *
  `;

  if (!entry) return c.json({ error: "Entry not found" }, 404);
  return c.json({ removed: true });
});

export default user;
