export const watchStatusValues = [
  "Watched",
  "In Progress",
  "Want to Watch",
] as const;
export type WatchStatus = (typeof watchStatusValues)[number];
