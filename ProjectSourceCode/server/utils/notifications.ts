import sql from "../db.ts";

/**
 * Creates a new notification for a specific user.
 * * @param userId - The ID of the user receiving the notification
 * @param message - The text to display in the notification bell
 * @returns boolean - True if successful, false if it failed
 */
export async function createNotification(
  userId: string,
  message: string,
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO public.notifications (user_id, message, is_read)
      VALUES (${userId}, ${message}, false)
    `;
    return true;
  } catch (error) {
    console.error(`Failed to create notification for user ${userId}:`, error);
    return false;
  }
}
``;
