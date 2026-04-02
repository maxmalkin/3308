import { z } from "zod";

export const streamingServiceValues = [
	"Apple TV",
	"Prime Video",
	"Paramount",
	"Netflix",
	"HBO Max",
	"Disney+",
	"Peacock",
] as const;

export const StreamingServiceSchema = z.enum(streamingServiceValues);

export type StreamingService = z.infer<typeof StreamingServiceSchema>;
