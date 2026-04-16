import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { fetchAndCacheShow } from "../utils/tmdb.ts";
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

// --- NOTIFICATION SETTINGS ROUTES ---

// 1. GET: Load the user's current preferences
user.get("/settings", async (c) => {
  const userId = c.get("userId");

  try {
    const settings = await sql`
      SELECT episode_alerts, reply_alerts 
      FROM public.notification_settings 
      WHERE user_id = ${userId}
    `;

    // If they don't have a row yet, default to true
    if (settings.length === 0) {
      return c.json({ episode_alerts: true, reply_alerts: true });
    }

    return c.json(settings[0]);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 2. PATCH: Save the new preferences when a user toggles a switch
user.patch("/settings", async (c) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const { episode_alerts, reply_alerts } = body;

    // Use an UPSERT in case they don't have a row yet
    const updatedSettings = await sql`
      INSERT INTO public.notification_settings (user_id, episode_alerts, reply_alerts)
      VALUES (${userId}, ${episode_alerts}, ${reply_alerts})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        episode_alerts = EXCLUDED.episode_alerts,
        reply_alerts = EXCLUDED.reply_alerts,
        updated_at = NOW()
      RETURNING episode_alerts, reply_alerts;
    `;

    return c.json({ success: true, settings: updatedSettings[0] }, 200);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default user;
