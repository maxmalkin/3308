import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { fetchAndCacheShow, searchTMDB } from "../utils/tmdb.ts";
import { createNotification } from "../utils/notifications.ts";
import {
  ShowIdParamSchema,
  ShowSearchQuerySchema,
} from "../validators/shows.ts";

// Define context variables for strict TypeScript checking
type Variables = {
  userId: string;
};

// Initialize router with the defined types
const shows = new Hono<{ Variables: Variables }>();

// --- TMDB ROUTES ---

shows.get("/search", async (c) => {
  const parsed = ShowSearchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { query, page } = parsed.data;

  try {
    const data = await searchTMDB(query, page);
    return c.json(data.results);
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
 * Dynamically queries the team's user_shows table
 */
shows.post("/webhooks/daily-episodes", async (c) => {
  try {
    const body = await c.req.json();
    const showName = body.showName;
    const showId = body.showId;

    if (!showName || !showId) {
      return c.json({ error: "Missing showName or showId" }, 400);
    }

    // Query the CORRECT table dynamically AND check user preferences
    const usersToNotify = await sql`
      SELECT us.user_id 
      FROM public.user_shows us
      JOIN public.notification_settings ns ON us.user_id = ns.user_id
      WHERE us.show_id = ${showId} 
        AND us.status = 'In Progress'
        AND ns.episode_alerts = TRUE
    `;

    let sentCount = 0;
    for (const row of usersToNotify) {
      const success = await createNotification(
        row.user_id,
        `A new episode of ${showName} drops tonight.`,
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
  // Safe extraction without "as any" thanks to the Variables type
  const likerId = c.get("userId");
  const reviewId = c.req.param("reviewId");

  // NOTE: This is an example. Needs real DB query.
  // const reviewOwnerId = await getReviewOwner(reviewId);

  return c.json({ message: "Review likes coming soon!" });
});

export default shows;
