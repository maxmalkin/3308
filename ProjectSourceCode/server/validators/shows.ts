import z from "zod";

export const ShowSearchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  page: z.coerce.number().int().positive().default(1),
});
export type ShowSearchQuery = z.infer<typeof ShowSearchQuerySchema>;

export const ShowIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type ShowIdParam = z.infer<typeof ShowIdParamSchema>;
