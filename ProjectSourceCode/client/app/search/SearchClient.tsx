"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CollectionShell from "@/components/CollectionShell";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import ShowCard from "@/components/ShowCard";
import type { Show } from "@/types/show";

type SearchResp = {
  results: Show[];
  source?: "semantic" | "tmdb";
  page?: number;
  limit?: number;
  hasMore?: boolean;
  error?: unknown;
};

type SortKey = "relevance" | "rating" | "newest" | "title";

const PAGE_SIZE = 20;

export default function SearchClient({
  q,
  initialResults,
  initialSource,
  initialHasMore,
  initialError,
}: {
  q: string;
  initialResults: Show[];
  initialSource: "semantic" | "tmdb" | null;
  initialHasMore: boolean;
  initialError: string | null;
}) {
  const [pages, setPages] = useState<Show[][]>(
    initialResults.length ? [initialResults] : [],
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [source, setSource] = useState<"semantic" | "tmdb" | null>(
    initialSource,
  );
  const [sort, setSort] = useState<SortKey>("relevance");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      setLoadingMore(true);
      try {
        const res = await fetch(
          `/api/shows/search?query=${encodeURIComponent(q)}&page=${targetPage}&limit=${PAGE_SIZE}`,
        );
        const data = (await res.json()) as SearchResp;
        if (!res.ok) {
          setError(
            typeof data.error === "string" ? data.error : "Search failed",
          );
          setHasMore(false);
          return;
        }
        const next = data.results ?? [];
        setSource(data.source ?? null);
        setHasMore(Boolean(data.hasMore) && next.length > 0);
        setPage(targetPage);
        setPages((prev) => [...prev, next]);
      } catch {
        setError("Network error");
        setHasMore(false);
      } finally {
        setLoadingMore(false);
      }
    },
    [q],
  );

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchPage(page + 1);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchPage]);

  const flat = useMemo(() => pages.flat(), [pages]);

  const sorted = useMemo(() => {
    if (sort === "relevance") return flat;
    const copy = flat.slice();
    if (sort === "rating") {
      copy.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    } else if (sort === "newest") {
      copy.sort((a, b) =>
        (b.first_air_date ?? "").localeCompare(a.first_air_date ?? ""),
      );
    } else if (sort === "title") {
      copy.sort((a, b) =>
        (a.name ?? a.original_name ?? "").localeCompare(
          b.name ?? b.original_name ?? "",
        ),
      );
    }
    return copy;
  }, [flat, sort]);

  const sub =
    q.length === 0
      ? "Type a query into the navbar to search."
      : source === "semantic"
        ? "Closest matches by meaning, ranked by similarity."
        : source === "tmdb"
          ? "Keyword matches from TMDB."
          : undefined;

  return (
    <CollectionShell
      active="search"
      eyebrow={q ? `search · "${q}"` : "search"}
      title={
        <>
          Results <em>for you.</em>
        </>
      }
      sub={sub}
      meta={
        flat.length > 0
          ? `${flat.length}${hasMore ? "+" : ""} ${flat.length === 1 ? "show" : "shows"}`
          : undefined
      }
    >
      {flat.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Sort</span>
          <SortChip current={sort} value="relevance" onPick={setSort}>
            Relevance
          </SortChip>
          <SortChip current={sort} value="rating" onPick={setSort}>
            Highest rated
          </SortChip>
          <SortChip current={sort} value="newest" onPick={setSort}>
            Newest
          </SortChip>
          <SortChip current={sort} value="title" onPick={setSort}>
            A–Z
          </SortChip>
        </div>
      )}

      {error && flat.length === 0 ? (
        <ErrorBanner message={error} />
      ) : q.length === 0 ? (
        <EmptyState
          title="No query"
          description="Use the search bar in the navbar to look up shows by title, genre, or vibe."
        />
      ) : flat.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`We couldn't find anything for "${q}". Try a different angle — a tone, a setting, an actor.`}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {sorted.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {loadingMore && (
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Loading more…
            </p>
          )}
          {!hasMore && !loadingMore && (
            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              End of results
            </p>
          )}
        </>
      )}
    </CollectionShell>
  );
}

function SortChip({
  current,
  value,
  onPick,
  children,
}: {
  current: SortKey;
  value: SortKey;
  onPick: (v: SortKey) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chip ${current === value ? "active" : ""}`}
      onClick={() => onPick(value)}
    >
      {children}
    </button>
  );
}
