import z from "zod";
import { WatchStatusSchema } from "./status.ts";

export const AddUserShowBodySchema = z.object({
  show_id: z.number().int().positive(),
  status: WatchStatusSchema.default("Want to Watch"),
});
export type AddUserShowBody = z.infer<typeof AddUserShowBodySchema>;

export const UpdateUserShowBodySchema = z.object({
  status: WatchStatusSchema,
});
export type UpdateUserShowBody = z.infer<typeof UpdateUserShowBodySchema>;

export const UserShowsQuerySchema = z.object({
  status: WatchStatusSchema.optional(),
});
export type UserShowsQuery = z.infer<typeof UserShowsQuerySchema>;
