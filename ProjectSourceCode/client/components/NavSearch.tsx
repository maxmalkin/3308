"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Show } from "@/types/show";
import { tmdbImageUrl } from "@/utils/show";

type SearchResp = {
  results: Array<Show & { user_status?: string | null }>;
  source?: "semantic" | "tmdb";
};

export default function NavSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Show[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setErr(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const myReq = ++reqIdRef.current;
      try {
        const res = await fetch(
          `/api/shows/search?query=${encodeURIComponent(q)}&limit=5`,
        );
        const data = (await res.json()) as SearchResp & { error?: unknown };
        if (myReq !== reqIdRef.current) return;
        if (!res.ok) {
          setErr(typeof data.error === "string" ? data.error : "Search failed");
          setResults([]);
        } else {
          setErr(null);
          setResults(data.results ?? []);
          setActive(0);
        }
      } catch {
        if (myReq !== reqIdRef.current) return;
        setErr("Network error");
        setResults([]);
      } finally {
        if (myReq === reqIdRef.current) setLoading(false);
      }
    }, 220);
  }, [query]);

  function pickResult(show: Show) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/shows/${show.id}`);
  }

  function submitSearch() {
    const q = query.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && results.length > 0 && active < results.length) {
        pickResult(results[active]);
      } else {
        submitSearch();
      }
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full max-w-[420px]">
      <div className="flex items-center gap-2 rounded-full border border-line bg-oat px-3.5 py-1.5 transition focus-within:border-ink">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-60"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search shows, genres, vibes…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search shows"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-lg border border-line bg-cream shadow-[0_20px_40px_-18px_rgba(36,35,31,0.3)]">
          {loading && (
            <div className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Searching…
            </div>
          )}
          {!loading && err && (
            <div className="px-4 py-3 text-sm text-[color:#a13b2a]">{err}</div>
          )}
          {!loading && !err && results.length === 0 && (
            <div className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              No matches
            </div>
          )}
          {!loading && !err && results.length > 0 && (
            <button
              type="button"
              onClick={submitSearch}
              className="block w-full border-b border-line-soft px-4 py-2 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:bg-oat hover:text-ink"
            >
              See all results for "{query.trim()}" →
            </button>
          )}
          {!loading &&
            results.map((s, i) => {
              const url = tmdbImageUrl(s.poster_path, "w300");
              const title = s.name ?? s.original_name ?? "Untitled";
              const year = s.first_air_date?.slice(0, 4);
              const genres =
                s.genres
                  ?.slice(0, 2)
                  .map((g) => g.name)
                  .filter(Boolean)
                  .join(" · ") ?? "";
              return (
                <Link
                  key={s.id}
                  href={`/shows/${s.id}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`grid items-center gap-3 px-3 py-2 ${
                    i === active ? "bg-oat" : ""
                  }`}
                  style={{ gridTemplateColumns: "36px 1fr auto" }}
                >
                  <div className="aspect-[2/3] w-9 overflow-hidden rounded-sm border border-line bg-oat">
                    {url ? (
                      <Image
                        src={url}
                        alt={title}
                        width={36}
                        height={54}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-[13px] font-medium tracking-[-0.01em]">
                      {title}
                    </div>
                    <div className="truncate font-mono text-[10px] tracking-[0.06em] text-muted">
                      {[year, genres].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  {typeof s.vote_average === "number" && s.vote_average > 0 && (
                    <span className="font-mono text-[11px] text-[var(--mustard)]">
                      ★ {s.vote_average.toFixed(1)}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
