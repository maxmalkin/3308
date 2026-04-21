"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CollectionShell from "@/components/CollectionShell";
import Dropdown from "@/components/Dropdown";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { Profile } from "@/types/api";
import type { Show } from "@/types/show";
import { streamingServiceValues } from "@/types/streaming";
import { isAuthenticated } from "@/utils/api";

type BrowseResp = {
  results: Show[];
  page?: number;
  limit?: number;
  sort?: string;
  hasMore?: boolean;
  error?: unknown;
};

type Sort = "popular" | "rating" | "newest" | "az";

const PAGE_SIZE = 30;

const GENRES = [
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Kids",
  "Mystery",
  "Reality",
  "Sci-Fi & Fantasy",
  "War & Politics",
  "Western",
] as const;

export default function BrowseClient() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);
  const profile = useApiResource<Profile>(authed ? "user/profile" : null, {
    requireAuth: true,
  });
  const ownedServices = useMemo(
    () => (profile.data?.user.owned_services ?? []) as string[],
    [profile.data],
  );

  const [sort, setSort] = useState<Sort>("popular");
  const [genreSel, setGenreSel] = useState<string[]>([]);
  const [providerSel, setProviderSel] = useState<string[]>([]);
  const [pages, setPages] = useState<Show[][]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const reqIdRef = useRef(0);

  const queryString = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(PAGE_SIZE));
      params.set("sort", sort);
      if (genreSel.length > 0) params.set("genre", genreSel.join(","));
      if (providerSel.length > 0) params.set("provider", providerSel.join(","));
      return params.toString();
    },
    [sort, genreSel, providerSel],
  );

  const fetchPage = useCallback(
    async (targetPage: number, reset: boolean) => {
      const myReq = ++reqIdRef.current;
      const setBusy = reset ? setLoading : setLoadingMore;
      setBusy(true);
      if (reset) setError(null);
      try {
        const res = await fetch(`/api/shows/browse?${queryString(targetPage)}`);
        const data = (await res.json()) as BrowseResp;
        if (myReq !== reqIdRef.current) return;
        if (!res.ok) {
          setError(
            typeof data.error === "string" ? data.error : "Browse failed",
          );
          if (reset) setPages([]);
          setHasMore(false);
          return;
        }
        const next = data.results ?? [];
        setHasMore(Boolean(data.hasMore) && next.length > 0);
        setPage(targetPage);
        setPages((prev) => (reset ? [next] : [...prev, next]));
      } catch {
        if (myReq !== reqIdRef.current) return;
        setError("Network error");
        if (reset) setPages([]);
        setHasMore(false);
      } finally {
        if (myReq === reqIdRef.current) setBusy(false);
      }
    },
    [queryString],
  );

  useEffect(() => {
    setPages([]);
    setPage(1);
    setHasMore(false);
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchPage(page + 1, false);
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPage]);

  const flat = useMemo(() => pages.flat(), [pages]);

  const sub =
    authed && providerSel.length === 0 && ownedServices.length > 0
      ? `Filtered to your ${ownedServices.length} streaming service${ownedServices.length === 1 ? "" : "s"}.`
      : authed
        ? "Browse the full PillarBoxd catalog."
        : "Browse the full PillarBoxd catalog. Sign in to filter by your services.";

  const serviceEmpty =
    authed && ownedServices.length > 0
      ? `Owned (${ownedServices.length})`
      : "All";

  return (
    <CollectionShell
      active="browse"
      eyebrow="browse"
      title={
        <>
          Every show, <em>your way.</em>
        </>
      }
      sub={sub}
      meta={
        flat.length > 0
          ? `${flat.length}${hasMore ? "+" : ""} ${flat.length === 1 ? "show" : "shows"}`
          : undefined
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Dropdown
          label="Genre"
          multi
          value={genreSel}
          onChange={setGenreSel}
          emptyLabel="All"
          options={GENRES.map((g) => ({ value: g, label: g }))}
        />
        <Dropdown
          label="Service"
          multi
          value={providerSel}
          onChange={setProviderSel}
          emptyLabel={serviceEmpty}
          options={streamingServiceValues.map((s) => ({
            value: s,
            label: s,
            hint: ownedServices.includes(s) ? "Owned" : undefined,
          }))}
        />
        <Dropdown
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "popular", label: "Popular" },
            { value: "rating", label: "Highest rated" },
            { value: "newest", label: "Newest" },
            { value: "az", label: "A–Z" },
          ]}
        />
      </div>

      {loading && flat.length === 0 ? (
        <PosterGridSkeleton />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : flat.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try widening the filters above."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {flat.map((s) => (
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
              End of catalog
            </p>
          )}
        </>
      )}
    </CollectionShell>
  );
}

function PosterGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
      {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((k) => (
        <div key={k} className="aspect-2/3 animate-pulse rounded-2xl bg-oat" />
      ))}
    </div>
  );
}
