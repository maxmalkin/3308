export const streamingServiceValues = [
  "Apple TV",
  "Prime Video",
  "Paramount",
  "Netflix",
  "HBO Max",
  "Disney+",
  "Peacock",
] as const;

export type StreamingService = (typeof streamingServiceValues)[number];
