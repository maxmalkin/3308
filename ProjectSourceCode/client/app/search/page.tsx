"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CollectionShell from "@/components/CollectionShell";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import ShowCard from "@/components/ShowCard";
import type { Show } from "@/types/show";

type SearchResp = {
  results: Show[];
  source?: "semantic" | "tmdb";
  error?: unknown;
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <CollectionShell active="search" eyebrow="search" title={<>Loading…</>}>
          <PosterGridSkeleton />
        </CollectionShell>
      }
    >
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Show[]>([]);
  const [source, setSource] = useState<"semantic" | "tmdb" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setSource(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/shows/search?query=${encodeURIComponent(q)}&limit=20`)
      .then(async (res) => {
        const data = (await res.json()) as SearchResp;
        if (cancelled) return;
        if (!res.ok) {
          setError(
            typeof data.error === "string" ? data.error : "Search failed",
          );
          setResults([]);
        } else {
          setResults(data.results ?? []);
          setSource(data.source ?? null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Network error");
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

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
        results.length > 0
          ? `${results.length} ${results.length === 1 ? "show" : "shows"}`
          : undefined
      }
    >
      {loading ? (
        <PosterGridSkeleton />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : q.length === 0 ? (
        <EmptyState
          title="No query"
          description="Use the search bar in the navbar to look up shows by title, genre, or vibe."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`We couldn't find anything for "${q}". Try a different angle — a tone, a setting, an actor.`}
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {results.map((s) => (
            <ShowCard key={s.id} show={s} />
          ))}
        </div>
      )}
    </CollectionShell>
  );
}

function PosterGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
      {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((k) => (
        <div
          key={k}
          className="aspect-[2/3] animate-pulse rounded-2xl bg-oat"
        />
      ))}
    </div>
  );
}
