import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { ShowSearchQuerySchema, ShowIdParamSchema } from "../types/shows.ts";
import { searchTMDB, fetchAndCacheShow } from "../utils/tmdb.ts";
import { createNotification } from "../utils/notifications.ts";

const shows = new Hono();

// --- TMDB ROUTES ---

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

// --- NOTIFICATION TRIGGERS ---

/**
 * WEBHOOK: Daily Episode Alerts
 * This query now matches your Pro Watchlist schema perfectly.
 */
shows.post("/webhooks/daily-episodes", async (c) => {
  try {
    const showName = "Shōgun";
    const showId = "show-123";

    // 1. Fetch users from the REAL watchlists table we built.
    // Notice 'In Progress' matches your Supabase enum exactly!
    const usersToNotify = await sql`
      SELECT user_id 
      FROM public.watchlists 
      WHERE show_id = ${showId} AND status = 'In Progress'
    `;

    // 2. Fire notifications using our utility
    let sentCount = 0;
    for (const row of usersToNotify) {
      const success = await createNotification(
        row.user_id,
        `Get the popcorn ready! A new episode of ${showName} airs tonight.`,
      );
      if (success) sentCount++;
    }

    return c.json(
      {
        success: true,
        message: `Fired ${sentCount} notifications for ${showName}`,
      },
      200,
    );
  } catch (error) {
    console.error("Failed to trigger daily episode alerts:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Example route for future expansion: Review Likes
shows.post("/:reviewId/like", async (c) => {
  const likerId = c.get("userId" as any); // Type cast for context
  const reviewId = c.req.param("reviewId");

  // NOTE: This is an example. You'll need a real DB query to get the owner.
  // const reviewOwnerId = await getReviewOwner(reviewId);

  return c.json({ message: "Review likes coming soon!" });
});

export default shows;
