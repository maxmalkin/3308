import sql from "../db.ts";

export type NotificationKind = "episode" | "reply" | "system";

export async function createNotification(
  userId: string,
  message: string,
  kind: NotificationKind = "system",
): Promise<void> {
  const [settings] = await sql`
    SELECT episode_alerts, reply_alerts
    FROM public.notification_settings
    WHERE user_id = ${userId}
  `;

  if (settings) {
    if (kind === "episode" && settings.episode_alerts === false) return;
    if (kind === "reply" && settings.reply_alerts === false) return;
  }

  await sql`
    INSERT INTO public.notifications (user_id, message)
    VALUES (${userId}, ${message})
  `;
}
