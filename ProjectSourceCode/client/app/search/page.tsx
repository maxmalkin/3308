import type { Show } from "@/types/show";
import SearchClient from "./SearchClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PAGE_SIZE = 20;

type SearchResp = {
  results: Show[];
  source?: "semantic" | "tmdb";
  hasMore?: boolean;
};

async function fetchInitial(q: string): Promise<{
  results: Show[];
  source: "semantic" | "tmdb" | null;
  hasMore: boolean;
  error: string | null;
}> {
  if (q.length < 2) {
    return { results: [], source: null, hasMore: false, error: null };
  }
  try {
    const res = await fetch(
      `${API_URL}/api/shows/search?query=${encodeURIComponent(q)}&page=1&limit=${PAGE_SIZE}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) {
      return {
        results: [],
        source: null,
        hasMore: false,
        error: "Search failed",
      };
    }
    const data = (await res.json()) as SearchResp;
    return {
      results: data.results ?? [],
      source: data.source ?? null,
      hasMore: Boolean(data.hasMore),
      error: null,
    };
  } catch {
    return {
      results: [],
      source: null,
      hasMore: false,
      error: "Network error",
    };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const initial = await fetchInitial(q);

  return (
    <SearchClient
      q={q}
      initialResults={initial.results}
      initialSource={initial.source}
      initialHasMore={initial.hasMore}
      initialError={initial.error}
    />
  );
}
