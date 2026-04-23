import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { UpdateNotificationSettingsSchema } from "../validators/notifications.ts";

type AuthEnv = { Variables: { userId: string } };
const notifications = new Hono<AuthEnv>();

notifications.get("/", async (c) => {
  const userId = c.get("userId");

  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(c.req.query("limit") || "10", 10)),
  );
  const offset = (page - 1) * limit;
  const unreadOnly = c.req.query("unread") === "true";

  try {
    const userNotifications = unreadOnly
      ? await sql`
          SELECT id, message, is_read, created_at
          FROM public.notifications
          WHERE user_id = ${userId} AND is_read = false
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      : await sql`
          SELECT id, message, is_read, created_at
          FROM public.notifications
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;

    const [{ count }] = unreadOnly
      ? await sql`
          SELECT count(*) FROM public.notifications
          WHERE user_id = ${userId} AND is_read = false
        `
      : await sql`
          SELECT count(*) FROM public.notifications WHERE user_id = ${userId}
        `;

    const [{ count: unreadRaw }] = await sql`
      SELECT count(*) FROM public.notifications
      WHERE user_id = ${userId} AND is_read = false
    `;

    const total = parseInt(count, 10);
    return c.json(
      {
        notifications: userNotifications,
        unreadCount: parseInt(unreadRaw, 10),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      200,
    );
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

notifications.patch("/:id/read", async (c) => {
  const userId = c.get("userId");
  const notificationId = c.req.param("id");

  try {
    const updated = await sql`
      UPDATE public.notifications
      SET is_read = true
      WHERE id = ${notificationId} AND user_id = ${userId}
      RETURNING id, message, is_read, created_at
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

notifications.post("/mark-all-read", async (c) => {
  const userId = c.get("userId");
  try {
    const result = await sql`
      UPDATE public.notifications
      SET is_read = true
      WHERE user_id = ${userId} AND is_read = false
      RETURNING id
    `;
    return c.json({ updated: result.length }, 200);
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

notifications.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const notificationId = c.req.param("id");
  try {
    const deleted = await sql`
      DELETE FROM public.notifications
      WHERE id = ${notificationId} AND user_id = ${userId}
      RETURNING id
    `;
    if (deleted.length === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }
    return c.json({ removed: true }, 200);
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

notifications.delete("/", async (c) => {
  const userId = c.get("userId");
  try {
    const result = await sql`
      DELETE FROM public.notifications WHERE user_id = ${userId} RETURNING id
    `;
    return c.json({ removed: result.length }, 200);
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

notifications.get("/settings", async (c) => {
  const userId = c.get("userId");
  try {
    const [existing] = await sql`
      SELECT user_id, episode_alerts, reply_alerts, updated_at
      FROM public.notification_settings
      WHERE user_id = ${userId}
    `;

    if (existing) return c.json({ settings: existing }, 200);

    const [created] = await sql`
      INSERT INTO public.notification_settings (user_id)
      VALUES (${userId})
      RETURNING user_id, episode_alerts, reply_alerts, updated_at
    `;
    return c.json({ settings: created }, 200);
  } catch (error) {
    console.error("Failed to fetch notification settings:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

notifications.patch("/settings", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateNotificationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { episode_alerts, reply_alerts } = parsed.data;

  try {
    const [settings] = await sql`
      INSERT INTO public.notification_settings (user_id, episode_alerts, reply_alerts, updated_at)
      VALUES (
        ${userId},
        ${episode_alerts ?? true},
        ${reply_alerts ?? true},
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        episode_alerts = COALESCE(${episode_alerts ?? null}, public.notification_settings.episode_alerts),
        reply_alerts   = COALESCE(${reply_alerts ?? null},   public.notification_settings.reply_alerts),
        updated_at     = now()
      RETURNING user_id, episode_alerts, reply_alerts, updated_at
    `;
    return c.json({ settings }, 200);
  } catch (error) {
    console.error("Failed to update notification settings:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default notifications;
