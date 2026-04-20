"use client";

import { Skeleton } from "boneyard-js/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ShowCard from "@/components/ShowCard";
import {
  clearApiResourceCache,
  useApiResource,
} from "@/hooks/useApiResource";
import type { Profile, RecsResp, ShowsResp } from "@/types/api";
import type { Show, UserShow } from "@/types/show";
import type { SortKey } from "@/types/ui";
import { apiFetch } from "@/utils/api";
import { tmdbImageUrl } from "@/utils/show";
import { BONE_PROPS } from "@/utils/skeleton";

export default function LoggedInHome() {
  const profile = useApiResource<Profile>("user/profile", {
    requireAuth: true,
  });
  const watchlist = useApiResource<ShowsResp>("user/watchlist", {
    requireAuth: true,
  });
  const log = useApiResource<ShowsResp>("user/log", { requireAuth: true });
  const recs = useApiResource<RecsResp>("shows/recommendations", {
    requireAuth: true,
  });

  const username = profile.data?.user.username ?? "friend";

  const watchlistShows = watchlist.data?.shows ?? [];
  const logShows = log.data?.shows ?? [];
  const recShows = recs.data?.results ?? [];
  const featured = recShows[0] ?? null;
  const suggestion = recShows[1] ?? null;
  const recRail = recShows.slice(2);

  const stats = useMemo(() => {
    const wl = watchlist.data?.shows ?? [];
    const lg = log.data?.shows ?? [];
    const tracked = wl.length + lg.length;
    const inQueue = wl.length;
    const logged = lg.length;
    const yearNow = new Date().getFullYear();
    const finishedThisYear = lg.filter(
      (s) =>
        s.user_status === "Watched" &&
        s.user_updated_at &&
        new Date(s.user_updated_at).getFullYear() === yearNow,
    ).length;
    return [
      { n: tracked, l: "shows tracked" },
      { n: inQueue, l: "in your queue" },
      { n: finishedThisYear, l: `finished this year` },
      { n: logged, l: "logged entries" },
    ];
  }, [watchlist.data, log.data]);

  const hasUserShows = watchlistShows.length + logShows.length > 0;
  const showQueueStrip =
    watchlistShows.length > 0 || watchlist.status === "loading";
  const showDiary = logShows.length > 0 || log.status === "loading";
  const recsTitle = hasUserShows
    ? "Recommended this week"
    : "Picked for you to start with";
  const recsEyebrow = hasUserShows ? "for you" : "popular this season";

  return (
    <>
      <Navbar active="home" />

      <main className="flex-1">
        <div className="mx-auto max-w-380 px-6 pb-16 pt-6 md:px-12">
          <Greeter
            username={username}
            stats={stats}
            queueCount={watchlistShows.length}
            recCount={recShows.length}
            hasUserShows={hasUserShows}
          />

          {featured ? (
            <FeaturedCard show={featured} />
          ) : recs.status === "loading" ? (
            <Skeleton name="home-featured" loading={true} {...BONE_PROPS}>
              <div className="my-7 h-44 rounded-[14px] bg-oat" />
            </Skeleton>
          ) : null}

          {showQueueStrip && (
            <QueueStrip
              initial={watchlistShows.slice(0, 7)}
              loading={watchlist.status === "loading"}
            />
          )}

          <SectionHead eyebrow={recsEyebrow} title={recsTitle} />

          <RecsBlock
            shows={recRail.length > 0 ? recRail : recShows}
            loadingState={recs.status}
            error={recs.error?.message}
          />

          {showDiary && (
            <DiaryBlock
              log={logShows}
              suggestion={suggestion}
              loading={log.status === "loading"}
            />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

function Greeter({
  username,
  stats,
  queueCount,
  recCount,
  hasUserShows,
}: {
  username: string;
  stats: { n: number; l: string }[];
  queueCount: number;
  recCount: number;
  hasUserShows: boolean;
}) {
  const now = new Date();
  const day = now
    .toLocaleDateString(undefined, { weekday: "long" })
    .toLowerCase();
  const time = now.getHours();
  const period = time < 12 ? "morning" : time < 17 ? "afternoon" : "evening";
  const date = now
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toLowerCase();
  const visibleStats = hasUserShows ? stats : [];

  return (
    <section className="grid items-end gap-8 pb-3.5 pt-7 lg:gap-12 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <div className="eyebrow">
          {day} {period} · {date}
        </div>
        <h1 className="mt-2.5 text-[clamp(38px,4.4vw,58px)] font-medium leading-[1.02] tracking-[-0.03em]">
          {hasUserShows ? (
            <>
              Welcome back, <em>{username}</em>.
            </>
          ) : (
            <>
              Hey <em>{username}</em>, let's begin.
            </>
          )}
        </h1>
        <p className="mt-3 max-w-[52ch] text-sm text-muted">
          {hasUserShows ? (
            <>
              You've got{" "}
              <b className="text-ink">
                {queueCount} {queueCount === 1 ? "show" : "shows"} in your queue
              </b>{" "}
              and we've lined up {recCount} recommendations tuned to what you've
              watched.
            </>
          ) : (
            <>
              Your queue and log are empty for now. Start by adding a show from
              the picks below, and your recommendations will get smarter.
            </>
          )}
        </p>
      </div>
      {visibleStats.length > 0 && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line md:grid-cols-4">
          {visibleStats.map((s) => (
            <div key={s.l} className="bg-oat px-4 py-4">
              <div className="font-display text-[28px] font-medium leading-none tracking-[-0.02em]">
                {s.n}
              </div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedCard({ show }: { show: Show }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = show.name ?? show.original_name ?? "Untitled";
  const year = show.first_air_date ? show.first_air_date.slice(0, 4) : "—";
  const network = show.networks?.[0]?.name ?? "Streaming";
  const rating =
    typeof show.vote_average === "number" && show.vote_average > 0
      ? show.vote_average.toFixed(1)
      : null;
  const posterUrl = tmdbImageUrl(show.poster_path, "w500");

  async function handleAdd() {
    setAdding(true);
    setErr(null);
    try {
      await apiFetch("user/shows", {
        method: "POST",
        body: JSON.stringify({
          show_id: show.id,
          status: "Want to Watch",
        }),
      });
      clearApiResourceCache("user/");
      setAdded(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add show.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="relative my-7 grid grid-cols-1 gap-6 overflow-hidden rounded-[14px] border border-line bg-oat p-5 lg:grid-cols-[160px_1fr_220px]">
      <div className="relative aspect-2/3 w-full max-w-40 self-start overflow-hidden rounded-md bg-oat shadow-[0_1px_2px_rgba(43,38,32,0.04),0_1px_0_rgba(43,38,32,0.06)]">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="160px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted">
            No poster
          </div>
        )}
      </div>
      <div className="px-1">
        <div className="eyebrow !text-(--clay)">
          ◉ Featured today · picked for you
        </div>
        <h2 className="mt-2 font-medium text-[clamp(26px,2.8vw,38px)] leading-[1.05] tracking-[-0.025em]">
          {title}
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[13px] text-muted">
          <span>{year}</span>
          <span>·</span>
          <span>{network}</span>
          {rating && (
            <>
              <span>·</span>
              <span className="font-medium text-(--clay)">★ {rating}</span>
            </>
          )}
          <span>·</span>
          <span className="font-mono text-[11px]">PICKED FOR YOU</span>
        </div>
        {show.overview && (
          <p className="mt-3 max-w-[58ch] text-sm leading-[1.55] text-ink-2">
            {show.overview}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/shows/${show.id}`} className="btn-accent btn">
            ▶ Details
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || added}
            className="btn-outline btn"
          >
            {added ? "✓ In queue" : adding ? "Adding…" : "+ Add to queue"}
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
      </div>
      <div className="border-t border-dashed border-line pl-0 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          Why we picked it
        </h4>
        <p className="mb-3.5 text-[13px] leading-[1.55] text-ink-2">
          Based on the shows in your log and the streaming services you have.
        </p>
        {show.networks && show.networks.length > 0 && (
          <>
            <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Networks
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {show.networks.slice(0, 4).map((n) => (
                <span key={n.name} className="pill-tag">
                  {n.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function QueueStrip({
  initial,
  loading,
}: {
  initial: UserShow[];
  loading: boolean;
}) {
  const [items, setItems] = useState<UserShow[]>(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  async function remove(id: number) {
    setItems((prev) => prev.filter((s) => s.id !== id));
    try {
      await apiFetch(`user/shows/${id}`, { method: "DELETE" });
      clearApiResourceCache("user/");
    } catch {
      setItems(initial);
    }
  }

  if (loading) {
    return (
      <Skeleton name="home-queue-strip" loading={true} {...BONE_PROPS}>
        <section className="mb-10 rounded-[14px] border border-line-soft bg-oat px-6 py-5">
          <div className="h-32 rounded bg-oat/60" />
        </section>
      </Skeleton>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mb-10 rounded-[14px] border border-line-soft bg-oat px-6 py-7 text-center">
        <div className="eyebrow mb-2">your queue · empty</div>
        <p className="font-display text-xl font-medium tracking-[-0.02em]">
          Nothing in the queue.
        </p>
        <p className="mt-1 text-sm text-muted">
          Add shows from search or recommendations to start your queue.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-10 rounded-[14px] border border-line-soft bg-oat px-6 py-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">your queue · next up</div>
          <h2 className="font-medium text-[22px] tracking-[-0.02em]">
            Shows you've been meaning to start
          </h2>
        </div>
        <div className="text-xs text-muted">
          {items.length} {items.length === 1 ? "show" : "shows"}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {items.slice(0, 7).map((s, i) => {
          const url = tmdbImageUrl(s.poster_path, "w500");
          const title = s.name ?? s.original_name ?? "Untitled";
          return (
            <Link
              key={s.id}
              href={`/shows/${s.id}`}
              className="group relative aspect-2/3 cursor-pointer overflow-hidden rounded-md shadow-[0_1px_2px_rgba(43,38,32,0.04),0_1px_0_rgba(43,38,32,0.06)]"
            >
              <span className="absolute left-1.5 top-1.5 z-10 rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] text-paper">
                0{i + 1}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  remove(s.id);
                }}
                aria-label={`Remove ${title}`}
                className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-[11px] text-paper opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
              {url ? (
                <Image
                  src={url}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 33vw, 14vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full place-items-center bg-oat text-xs text-muted">
                  {title}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between border-b border-line-soft pb-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-0.5 font-medium text-2xl tracking-[-0.02em]">
          {title}
        </h2>
      </div>
      {meta && <div className="text-xs text-muted">{meta}</div>}
    </div>
  );
}

function RecsBlock({
  shows,
  loadingState,
  error,
}: {
  shows: Show[];
  loadingState: "loading" | "ready" | "error" | "unauth";
  error?: string;
}) {
  const [genre, setGenre] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("rec");

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const s of shows) {
      for (const g of s.genres ?? []) {
        if (g.name) set.add(g.name);
      }
    }
    return ["All", ...Array.from(set).sort()];
  }, [shows]);

  const filtered = useMemo(() => {
    let out = shows.slice();
    if (genre !== "All") {
      out = out.filter((s) => s.genres?.some((g) => g.name === genre));
    }
    if (sort === "rating") {
      out.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    } else if (sort === "newest") {
      out.sort((a, b) => {
        const aD = a.first_air_date ?? "";
        const bD = b.first_air_date ?? "";
        return bD.localeCompare(aD);
      });
    }
    return out;
  }, [shows, genre, sort]);

  if (loadingState === "loading") {
    return (
      <Skeleton name="home-recs" loading={true} {...BONE_PROPS}>
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {["a", "b", "c", "d", "e", "f"].map((k) => (
            <div key={k} className="aspect-2/3 rounded-2xl bg-oat" />
          ))}
        </div>
      </Skeleton>
    );
  }
  if (loadingState === "error") {
    return <ErrorBanner message={error} />;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">Genre</span>
        {allGenres.slice(0, 8).map((g) => (
          <button
            type="button"
            key={g}
            className={`chip ${genre === g ? "active" : ""}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
        <span className="flex-1" />
        <span className="mr-1 eyebrow">Sort</span>
        <button
          type="button"
          className={`chip ${sort === "rec" ? "active" : ""}`}
          onClick={() => setSort("rec")}
        >
          Recommended
        </button>
        <button
          type="button"
          className={`chip ${sort === "rating" ? "active" : ""}`}
          onClick={() => setSort("rating")}
        >
          Highest rated
        </button>
        <button
          type="button"
          className={`chip ${sort === "newest" ? "active" : ""}`}
          onClick={() => setSort("newest")}
        >
          Newest
        </button>
      </div>

      {filtered.length === 0 ? (
        shows.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            description="Add a few shows to your queue or log and we'll start tailoring picks to your taste."
          />
        ) : (
          <EmptyState
            title="Nothing matches your filters"
            description="Try widening the genre or service filters above."
          />
        )
      ) : (
        <div className="mb-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {filtered.slice(0, 12).map((s) => (
            <ShowCard key={s.id} show={s} />
          ))}
        </div>
      )}
    </>
  );
}

function DiaryBlock({
  log,
  suggestion,
  loading,
}: {
  log: UserShow[];
  suggestion: Show | null;
  loading: boolean;
}) {
  const recent = useMemo(
    () =>
      log
        .filter((s) => s.user_status === "Watched")
        .slice()
        .sort((a, b) =>
          (b.user_updated_at ?? "").localeCompare(a.user_updated_at ?? ""),
        )
        .slice(0, 6),
    [log],
  );

  const genreBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of log) {
      for (const g of s.genres ?? []) {
        if (g.name) counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
      }
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g, n]) => ({ g, p: Math.round((n / total) * 100) }));
  }, [log]);

  return (
    <section className="my-12 grid gap-7 lg:grid-cols-[2fr_1fr]">
      <div>
        <SectionHead eyebrow="your log" title="Recently watched" />
        {loading ? (
          <Skeleton name="home-diary" loading={true} {...BONE_PROPS}>
            <div className="space-y-3">
              {["a", "b", "c", "d"].map((k) => (
                <div key={k} className="h-20 rounded-md bg-oat" />
              ))}
            </div>
          </Skeleton>
        ) : recent.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            description="Mark shows as watched and they'll appear here."
          />
        ) : (
          <div>
            {recent.map((s) => {
              const url = tmdbImageUrl(s.poster_path, "w300");
              const title = s.name ?? s.original_name ?? "Untitled";
              const date = s.user_updated_at
                ? new Date(s.user_updated_at)
                : null;
              const day = date?.getDate() ?? "—";
              const month = date
                ?.toLocaleDateString(undefined, {
                  month: "short",
                })
                .toUpperCase();
              return (
                <Link
                  key={s.id}
                  href={`/shows/${s.id}`}
                  className="grid items-start gap-4 border-b border-line-soft py-4 last:border-0 hover:bg-oat/40"
                  style={{
                    gridTemplateColumns: "60px 70px 1fr",
                  }}
                >
                  <div className="pt-1 text-center font-mono text-[11px] uppercase leading-[1.4] tracking-[0.06em] text-muted">
                    {month}
                    <b className="block font-display text-lg font-medium tracking-[-0.02em] text-ink">
                      {day}
                    </b>
                  </div>
                  <div className="aspect-2/3 w-[70px] overflow-hidden rounded-sm border border-line">
                    {url ? (
                      <Image
                        src={url}
                        alt={title}
                        width={70}
                        height={105}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-oat text-[10px] text-muted">
                        {title}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-display text-lg font-medium tracking-[-0.02em]">
                      {title}
                    </div>
                    <div className="mt-1 text-sm text-ink-2">
                      {s.overview?.slice(0, 110)}
                      {s.overview && s.overview.length > 110 ? "…" : ""}
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {s.user_status} · {s.networks?.[0]?.name ?? "—"} ·{" "}
                      {s.first_air_date?.slice(0, 4) ?? "—"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <aside className="space-y-4">
        <div className="card p-5">
          <h3 className="font-display text-lg font-medium tracking-[-0.02em]">
            Your taste, mostly.
          </h3>
          <div className="mt-1 mb-3.5 text-xs text-muted">
            Based on the {log.length} {log.length === 1 ? "show" : "shows"} in
            your log.
          </div>
          {genreBreakdown.length === 0 ? (
            <p className="text-sm text-muted">
              Log a few shows and your top genres will appear here.
            </p>
          ) : (
            genreBreakdown.map((gb) => (
              <div
                key={gb.g}
                className="flex items-center justify-between border-b border-dashed border-line-soft py-2 text-sm last:border-0"
              >
                <span>{gb.g}</span>
                <span className="mx-3 h-1 max-w-[120px] flex-1 self-center overflow-hidden rounded-full bg-line">
                  <i
                    className="block h-full bg-(--accent)"
                    style={{ width: `${gb.p}%` }}
                  />
                </span>
                <span className="w-9 text-right font-mono text-[11px] text-muted">
                  {gb.p}%
                </span>
              </div>
            ))
          )}
        </div>
        {suggestion && (
          <div
            className="card p-5"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
            }}
          >
            <div className="eyebrow mb-2" style={{ color: "var(--clay-soft)" }}>
              this week's suggestion
            </div>
            <h3 className="font-display text-lg font-medium tracking-[-0.02em] text-paper">
              Try{" "}
              <em style={{ color: "var(--clay-soft)" }}>
                {suggestion.name ?? suggestion.original_name}
              </em>
              .
            </h3>
            <p
              className="my-2 text-[13px] leading-[1.55]"
              style={{ color: "rgba(242,233,214,0.78)" }}
            >
              {suggestion.overview?.slice(0, 180) ??
                "A pick from your recommendations you haven't started yet."}
              {suggestion.overview && suggestion.overview.length > 180
                ? "…"
                : ""}
            </p>
            <Link
              href={`/shows/${suggestion.id}`}
              className="btn"
              style={{ background: "var(--clay)", color: "#fff" }}
            >
              Have a look →
            </Link>
          </div>
        )}
      </aside>
    </section>
  );
}
