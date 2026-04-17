import type { WatchStatus } from "@/types/show";

export function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function backdropUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w1280${path}`;
}

export function yearFrom(date: string | null): string | null {
  if (!date) return null;
  const y = date.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

export function yearRange(
  first: string | null,
  last: string | null,
): string | null {
  const start = yearFrom(first);
  const end = yearFrom(last);
  if (!start && !end) return null;
  if (start && end && start === end) return start;
  return `${start ?? "?"} \u2013 ${end ?? "Present"}`;
}

export function statusPillClass(status: WatchStatus): string {
  if (status === "Watched") return "bg-emerald-600 text-white";
  if (status === "In Progress") return "bg-amber-500 text-white";
  return "bg-gray-800 text-white";
}
