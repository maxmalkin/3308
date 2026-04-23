import { z } from "zod";

export const UpdateNotificationSettingsSchema = z
  .object({
    episode_alerts: z.boolean().optional(),
    reply_alerts: z.boolean().optional(),
  })
  .refine(
    (v) => v.episode_alerts !== undefined || v.reply_alerts !== undefined,
    {
      message: "At least one setting must be provided",
    },
  );
