import z from "zod";
import { StreamingServiceSchema } from "../models/enums.ts";

export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(1).max(32),
  owned_services: z.array(StreamingServiceSchema).default([]),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;
