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

  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(c.req.query("limit") || "10", 10)),
  );
  const offset = (page - 1) * limit;

  try {
    const userNotifications = await sql`
      SELECT id, message, is_read, created_at
      FROM public.notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [{ count }] = await sql`
      SELECT count(*) FROM public.notifications WHERE user_id = ${userId}
    `;

    const [{ count: unreadRaw }] = await sql`
      SELECT count(*) FROM public.notifications
      WHERE user_id = ${userId} AND is_read = false
    `;

    return c.json(
      {
        notifications: userNotifications,
        unreadCount: parseInt(unreadRaw, 10),
        pagination: {
          total: parseInt(count, 10),
          page,
          limit,
          totalPages: Math.ceil(parseInt(count, 10) / limit),
        },
      },
      200,
    );
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
