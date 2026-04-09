import { Hono } from "hono";
import sql from "../db.ts";

// Create a new router and protect all routes with the auth middleware
type AuthEnv = { Variables: { userId: string } };
const notifications = new Hono<AuthEnv>();

/**
 * GET /api/notifications
 * Fetches all unread notifications for the logged-in user.
 */
notifications.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    const userNotifications = await sql`
      SELECT id, message, is_read, created_at 
      FROM public.notifications 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return c.json({ notifications: userNotifications }, 200);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read.
 */
notifications.patch("/:id/read", async (c) => {
  const userId = c.get("userId");
  const notificationId = c.req.param("id");

  try {
    const updated = await sql`
      UPDATE public.notifications 
      SET is_read = true 
      WHERE id = ${notificationId} AND user_id = ${userId}
      RETURNING *
    `;

    if (updated.length === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }

    return c.json(
      { message: "Notification marked as read", notification: updated[0] },
      200,
    );
  } catch (error) {
    console.error("Failed to update notification:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default notifications;
