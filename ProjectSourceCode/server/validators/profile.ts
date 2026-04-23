import z from "zod";
import { StreamingServiceSchema } from "../models/enums.ts";

export const UpdateProfileBodySchema = z
  .object({
    username: z.string().min(1).max(32).optional(),
    owned_services: z.array(StreamingServiceSchema).optional(),
  })
  .refine((v) => v.username !== undefined || v.owned_services !== undefined, {
    message: "At least one field must be provided",
  });
