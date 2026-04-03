import { z } from "zod";
import { StreamingServiceSchema } from "../models/enums.ts";

export const RegisterBodySchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(32, "Username must be 32 characters or less"),
  owned_services: z.array(StreamingServiceSchema).default([]),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
