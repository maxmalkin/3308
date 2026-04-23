import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { createNotification } from "../utils/notifications.ts";
import { fetchAndCacheShow } from "../utils/tmdb.ts";
import { UpdateProfileBodySchema } from "../validators/profile.ts";
import {
  AddUserShowBodySchema,
  UpdateUserShowBodySchema,
} from "../validators/userShows.ts";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

const user = new Hono<AuthEnv>();

user.get("/profile", async (c) => {
  const userId = c.get("userId");

  const [profile] = await sql`
    SELECT id, username, email, owned_services
    FROM public."user"
    WHERE id = ${userId}
  `;

  if (!profile) return c.json({ error: "User not found" }, 404);
  return c.json({ user: profile });
});

user.patch("/profile", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateProfileBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { username, owned_services } = parsed.data;

  if (username !== undefined) {
    const clash = await sql`
      SELECT 1 FROM public."user"
      WHERE username = ${username} AND id <> ${userId}
    `;
    if (clash.length > 0) {
      return c.json({ error: "Username already taken" }, 409);
    }
  }

  try {
    const [updated] = await sql`
      UPDATE public."user"
      SET
        username       = COALESCE(${username ?? null}, username),
        owned_services = COALESCE(${owned_services ?? null}::text[], owned_services)
      WHERE id = ${userId}
      RETURNING id, username, email, owned_services
    `;
    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json({ user: updated });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

user.get("/watchlist", async (c) => {
  const userId = c.get("userId");
  const rows = await sql`
    SELECT
      us.status AS user_status,
      us.added_at AS user_added_at,
      us.updated_at AS user_updated_at,
      s.*
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
    SELECT
      us.status AS user_status,
      us.added_at AS user_added_at,
      us.updated_at AS user_updated_at,
      s.*
    FROM public.user_shows us
    JOIN public.shows s ON s.id = us.show_id
    WHERE us.user_id = ${userId}
      AND us.status IN ('Watched', 'In Progress')
    ORDER BY us.updated_at DESC
  `;
  return c.json({ shows: rows });
});

user.get("/shows/:showId", async (c) => {
  const userId = c.get("userId");
  const showId = Number(c.req.param("showId"));
  if (!Number.isFinite(showId) || showId <= 0) {
    return c.json({ error: "Invalid show id" }, 400);
  }
  const [entry] = await sql`
    SELECT status, added_at, updated_at
    FROM public.user_shows
    WHERE user_id = ${userId} AND show_id = ${showId}
  `;
  if (!entry) return c.json({ status: null });
  return c.json({
    status: entry.status,
    added_at: entry.added_at,
    updated_at: entry.updated_at,
  });
});

user.post("/shows", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = AddUserShowBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { show_id, status } = parsed.data;

  let showName = `show #${show_id}`;
  try {
    const show = await fetchAndCacheShow(show_id);
    if (!show) return c.json({ error: "Show not found on TMDB" }, 404);
    if (show.name) showName = show.name;
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

  await createNotification(
    userId,
    `Added "${showName}" to your ${status} list`,
  ).catch((err) => console.error("Notification creation failed:", err));

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

  const [show] = await sql`SELECT name FROM public.shows WHERE id = ${showId}`;
  const showName = show?.name ?? `show #${showId}`;
  await createNotification(userId, `"${showName}" moved to ${status}`).catch(
    (err) => console.error("Notification creation failed:", err),
  );

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
