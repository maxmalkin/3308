import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import {
  AddUserShowBodySchema,
  UpdateUserShowBodySchema,
  UserShowsQuerySchema,
} from "../types/userShows.ts";
import { fetchAndCacheShow } from "../utils/tmdb.ts";

const userShows = new Hono();

userShows.get("/", async (c) => {
  const username = c.req.param("username")!;
  const parsed = UserShowsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { status } = parsed.data;

  const rows = await sql`
		SELECT us.status, us.added_at, us.updated_at, s.*
		FROM public.user_shows us
		JOIN public.shows s ON s.id = us.show_id
		WHERE us.username = ${username}
		${status ? sql`AND us.status = ${status}` : sql``}
		ORDER BY us.updated_at DESC
	`;

  return c.json({ shows: rows });
});

userShows.post("/", async (c) => {
  const username = c.req.param("username")!;
  const body = await c.req.json();
  const parsed = AddUserShowBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { show_id, status } = parsed.data;

  const [user] = await sql`
		SELECT 1 FROM public."user" WHERE username = ${username}
	`;
  if (!user) return c.json({ error: "User not found" }, 404);

  try {
    const show = await fetchAndCacheShow(show_id);
    if (!show) return c.json({ error: "Show not found on TMDB" }, 404);
  } catch {
    return c.json({ error: "Failed to fetch show from TMDB" }, 502);
  }

  const existing = await sql`
		SELECT 1 FROM public.user_shows
		WHERE username = ${username} AND show_id = ${show_id}
	`;
  if (existing.length > 0) {
    return c.json({ error: "Show already on list" }, 409);
  }

  const [entry] = await sql`
		INSERT INTO public.user_shows (username, show_id, status)
		VALUES (${username}, ${show_id}, ${status})
		RETURNING *
	`;

  return c.json({ entry }, 201);
});

userShows.patch("/:showId", async (c) => {
  const username = c.req.param("username")!;
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
		WHERE username = ${username} AND show_id = ${showId}
		RETURNING *
	`;

  if (!entry) return c.json({ error: "Entry not found" }, 404);
  return c.json({ entry });
});

userShows.delete("/:showId", async (c) => {
  const username = c.req.param("username")!;
  const showId = Number(c.req.param("showId"));

  const [entry] = await sql`
		DELETE FROM public.user_shows
		WHERE username = ${username} AND show_id = ${showId}
		RETURNING *
	`;

  if (!entry) return c.json({ error: "Entry not found" }, 404);
  return c.json({ removed: true });
});

export default userShows;
