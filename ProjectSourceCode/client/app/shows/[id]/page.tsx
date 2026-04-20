"use client";

import { Skeleton } from "boneyard-js/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ResourceView } from "@/components/ResourceView";
import { useApiResource } from "@/hooks/useApiResource";
import type { Show, UserShow, WatchStatus } from "@/types/show";
import { ApiError, apiFetch, isAuthenticated } from "@/utils/api";
import { tmdbImageUrl, yearRange } from "@/utils/show";

type ShowResp = { show: Show };
type UserShowResp = { shows: UserShow[] };
type RelatedResp = { results: Show[] };

type Creator = {
  id?: number;
  name?: string;
  profile_path?: string | null;
};

type Episode = {
  id?: number;
  name?: string | null;
  overview?: string | null;
  air_date?: string | null;
  episode_number?: number | null;
  season_number?: number | null;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number | null;
};

type Season = {
  id?: number;
  name?: string;
  season_number?: number;
  episode_count?: number | null;
  air_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  vote_average?: number | null;
};

const BONE_PROPS = {
  animate: "shimmer",
  color: "var(--oat)",
  shimmerColor: "var(--paper)",
} as const;

export default function ShowDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;
  const resource = useApiResource<ShowResp>(id ? `shows/${id}` : null);
  const isLoading = resource.status === "loading";

  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <div className="flex-1">
        <ResourceView
          resource={resource}
          loading={
            <Skeleton name="show-detail" loading={true} {...BONE_PROPS}>
              <ShowDetailSkeleton />
            </Skeleton>
          }
          errorView={(err) => (
            <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-12">
              {err?.status === 404 ? (
                <div className="rounded-2xl border border-line bg-oat p-8">
                  <h1 className="font-display text-2xl font-medium tracking-[-0.02em]">
                    Show not found
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    We couldn't find that show. It may have been removed.
                  </p>
                </div>
              ) : (
                <ErrorBanner message={err?.message} />
              )}
            </div>
          )}
        >
          {(data) =>
            data.show ? (
              <Skeleton name="show-detail" loading={isLoading} {...BONE_PROPS}>
                <ShowDetail show={data.show} />
              </Skeleton>
            ) : (
              <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-12">
                <div className="rounded-2xl border border-line bg-oat p-8">
                  <h1 className="font-display text-2xl font-medium tracking-[-0.02em]">
                    Show not found
                  </h1>
                </div>
              </div>
            )
          }
        </ResourceView>
      </div>
      <Footer />
    </main>
  );
}

function ShowDetailSkeleton() {
  return (
    <>
      <div className="h-72 w-full bg-oat md:h-96" />
      <div className="mx-auto -mt-32 max-w-[1200px] px-6 pb-16 md:-mt-44 md:px-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-[2/3] w-full max-w-[260px] rounded-md bg-oat" />
            <div className="h-10 w-full rounded-lg bg-oat" />
            <div className="h-10 w-full rounded-lg bg-oat" />
            <div className="h-10 w-full rounded-lg bg-oat" />
          </div>
          <div className="space-y-6">
            <div className="lg:pt-12">
              <div className="h-16 w-2/3 rounded bg-oat" />
              <div className="mt-3 h-4 w-1/2 rounded bg-oat" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {["a", "b", "c", "d"].map((k) => (
                <div key={k} className="h-20 rounded bg-oat" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-oat" />
              <div className="h-4 w-11/12 rounded bg-oat" />
              <div className="h-4 w-10/12 rounded bg-oat" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ShowDetail({ show }: { show: Show }) {
  const title = show.name ?? show.original_name ?? "Untitled";
  const backdrop = tmdbImageUrl(show.backdrop_path, "w1280");
  const poster = tmdbImageUrl(show.poster_path, "w500");
  const years = yearRange(show.first_air_date, show.last_air_date);
  const providers = show.watch_providers_us?.flatrate ?? [];
  const rating =
    typeof show.vote_average === "number" && show.vote_average > 0
      ? show.vote_average.toFixed(1)
      : null;
  const networks = show.networks ?? [];
  const cast = (show.created_by ?? []) as Creator[];
  const seasons = (show.seasons ?? []) as Season[];
  const lastEp = show.last_episode_to_air as Episode | null;
  const nextEp = show.next_episode_to_air as Episode | null;
  const popularity =
    typeof show.popularity === "number" ? Math.round(show.popularity) : null;
  const voteCount =
    typeof show.vote_count === "number" ? show.vote_count : null;
  const runtime = show.episode_run_time?.[0] ?? null;

  return (
    <>
      <section className="relative h-72 w-full overflow-hidden bg-ink md:h-96">
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/0 via-ink/20 to-cream" />
      </section>

      <div className="mx-auto -mt-32 max-w-[1200px] px-6 pb-16 md:-mt-44 md:px-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
          <aside className="space-y-4">
            <div className="relative aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-md border border-line bg-oat shadow-[0_30px_60px_-25px_rgba(20,22,20,0.45),0_2px_6px_rgba(20,22,20,0.18)]">
              {poster ? (
                <Image
                  src={poster}
                  alt={title}
                  fill
                  sizes="260px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted">
                  No poster
                </div>
              )}
            </div>

            <ActionBar showId={show.id} />

            {(popularity !== null ||
              voteCount !== null ||
              runtime !== null) && (
              <div className="rounded-lg border border-line bg-oat px-4 py-3 text-[13px] text-ink-2">
                {runtime !== null && (
                  <div className="flex justify-between border-b border-line-soft py-1.5 last:border-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      runtime
                    </span>
                    <span>{runtime} min</span>
                  </div>
                )}
                {voteCount !== null && (
                  <div className="flex justify-between border-b border-line-soft py-1.5 last:border-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      votes
                    </span>
                    <span>{voteCount.toLocaleString()}</span>
                  </div>
                )}
                {popularity !== null && (
                  <div className="flex justify-between py-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      popularity
                    </span>
                    <span>{popularity}</span>
                  </div>
                )}
              </div>
            )}

            {networks.length > 0 && (
              <div>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Networks
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {networks.map((n) => (
                    <span key={n.name} className="pill-tag">
                      {n.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {providers.length > 0 && (
              <div>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Where to watch
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {providers.map((p) => (
                    <span
                      key={p.provider_name}
                      className="rounded-full bg-ink px-3 py-1 text-xs text-paper"
                    >
                      {p.provider_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div>
            <div className="mb-4 lg:pt-12">
              <h1 className="font-display text-[clamp(48px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.03em]">
                {title}
              </h1>
              {show.tagline && (
                <p className="mt-3 max-w-[60ch] font-display text-lg italic text-ink-2">
                  "{show.tagline}"
                </p>
              )}
            </div>

            {show.genres && show.genres.length > 0 && (
              <div className="mb-7 flex flex-wrap gap-2">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-line bg-oat px-3 py-1 text-sm text-ink-2"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line md:grid-cols-4">
              <Stat label="Aired" value={years ?? "—"} />
              <Stat label="Seasons" value={show.number_of_seasons ?? "—"} />
              <Stat label="Episodes" value={show.number_of_episodes ?? "—"} />
              <Stat
                label="Rating"
                value={rating ? `★ ${rating}` : "—"}
                accent
              />
            </div>

            {show.overview && (
              <section className="mb-10">
                <div className="eyebrow mb-3">Overview</div>
                <p className="max-w-[68ch] text-[15px] leading-[1.65] text-ink-2">
                  {show.overview}
                </p>
              </section>
            )}

            {(lastEp || nextEp || seasons.length > 0) && (
              <section className="mb-10">
                <div className="grid gap-6 md:grid-cols-2">
                  {lastEp && (
                    <div>
                      <div className="eyebrow mb-3">Last aired</div>
                      <EpisodeCard episode={lastEp} />
                    </div>
                  )}
                  {seasons.length > 0 && (
                    <div>
                      <div className="eyebrow mb-3">Seasons</div>
                      <ul className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
                        {seasons.map((s) => (
                          <li
                            key={s.id ?? s.season_number}
                            className="grid items-center gap-3 rounded-lg border border-line bg-oat px-3 py-2.5"
                            style={{ gridTemplateColumns: "44px 1fr auto" }}
                          >
                            <div className="aspect-[2/3] w-11 overflow-hidden rounded-sm border border-line bg-oat">
                              {s.poster_path ? (
                                <Image
                                  src={
                                    tmdbImageUrl(s.poster_path, "w300") ?? ""
                                  }
                                  alt={s.name ?? `Season ${s.season_number}`}
                                  width={44}
                                  height={66}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <div className="font-display text-[14px] font-medium tracking-[-0.015em]">
                                {s.name ?? `Season ${s.season_number}`}
                              </div>
                              <div className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-muted">
                                {s.episode_count
                                  ? `${s.episode_count} episodes`
                                  : "—"}
                                {s.air_date
                                  ? ` · ${s.air_date.slice(0, 4)}`
                                  : ""}
                              </div>
                            </div>
                            {typeof s.vote_average === "number" &&
                              s.vote_average > 0 && (
                                <span className="font-mono text-[11px] text-[var(--mustard)]">
                                  ★ {s.vote_average.toFixed(1)}
                                </span>
                              )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {nextEp && (
                  <div className="mt-6 max-w-[36rem]">
                    <div className="eyebrow mb-3">Next up</div>
                    <EpisodeCard episode={nextEp} />
                  </div>
                )}
              </section>
            )}

            {cast.length > 0 && (
              <section className="mb-10">
                <div className="eyebrow mb-3">Created by</div>
                <ul className="flex flex-wrap gap-3">
                  {cast.map((c) => (
                    <li
                      key={c.id ?? c.name}
                      className="flex items-center gap-2.5 rounded-full border border-line bg-oat py-1 pl-1 pr-3"
                    >
                      <span
                        className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-oat font-display text-sm text-ink-2"
                        aria-hidden
                      >
                        {c.profile_path ? (
                          <Image
                            src={tmdbImageUrl(c.profile_path, "w300") ?? ""}
                            alt={c.name ?? ""}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (c.name?.[0]?.toUpperCase() ?? "·")
                        )}
                      </span>
                      <span className="text-sm">{c.name ?? "Unknown"}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {show.status && (
              <section className="mb-10">
                <div className="eyebrow mb-1">Status</div>
                <p className="text-sm text-ink-2">{show.status}</p>
              </section>
            )}

            <RelatedSection showId={show.id} />
          </div>
        </div>
      </div>
    </>
  );
}

function EpisodeCard({ episode }: { episode: Episode }) {
  const still = episode.still_path
    ? tmdbImageUrl(episode.still_path, "w780")
    : null;
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-oat">
      {still && (
        <div className="relative aspect-[16/9] w-full bg-ink/10">
          <Image
            src={still}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="font-display text-[16px] font-medium tracking-[-0.02em]">
          {episode.name ?? "Untitled episode"}
          <span className="ml-2 font-mono text-[11px] font-normal text-muted">
            S{episode.season_number ?? "?"}·E{episode.episode_number ?? "?"}
          </span>
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          {episode.air_date ?? "TBA"}
          {episode.runtime ? ` · ${episode.runtime} min` : ""}
        </div>
        {episode.overview && (
          <p className="mt-2 text-[13px] leading-[1.55] text-ink-2">
            {episode.overview.length > 240
              ? `${episode.overview.slice(0, 240)}…`
              : episode.overview}
          </p>
        )}
      </div>
    </div>
  );
}

function RelatedSection({ showId }: { showId: number }) {
  const related = useApiResource<RelatedResp>(
    `shows/${showId}/related?limit=8`,
  );
  const isLoading = related.status === "loading";
  const shows = related.data?.results ?? [];
  if (!isLoading && shows.length === 0) return null;
  return (
    <section className="mb-4">
      <div className="eyebrow mb-3">If you liked this</div>
      <Skeleton name="show-related" loading={isLoading} {...BONE_PROPS}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {shows.slice(0, 8).map((s) => {
            const url = tmdbImageUrl(s.poster_path, "w300");
            const title = s.name ?? s.original_name ?? "Untitled";
            return (
              <li key={s.id}>
                <Link
                  href={`/shows/${s.id}`}
                  className="group block transition hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded border border-line bg-oat">
                    {url ? (
                      <Image
                        src={url}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-2 text-center text-[10px] text-muted">
                        {title}
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 truncate text-[13px] font-medium">
                    {title}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.06em] text-muted">
                    {s.first_air_date?.slice(0, 4) ?? "—"}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Skeleton>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-oat px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1.5 font-display text-[28px] font-medium leading-none tracking-[-0.02em] ${accent ? "text-[var(--clay)]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

const STATUS_OPTIONS: { status: WatchStatus; label: string }[] = [
  { status: "Want to Watch", label: "Add to queue" },
  { status: "In Progress", label: "Watching" },
  { status: "Watched", label: "Mark watched" },
];

function ActionBar({ showId }: { showId: number }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const watchlist = useApiResource<UserShowResp>(
    authed ? "user/watchlist" : null,
    { requireAuth: true },
  );
  const log = useApiResource<UserShowResp>(authed ? "user/log" : null, {
    requireAuth: true,
  });

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  useEffect(() => {
    if (!watchlist.data && !log.data) return;
    const all = [...(watchlist.data?.shows ?? []), ...(log.data?.shows ?? [])];
    const found = all.find((s) => s.id === showId);
    setStatus(found?.user_status ?? null);
  }, [watchlist.data, log.data, showId]);

  if (authed === false) {
    return (
      <a
        href="/login"
        className="block w-full rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-paper transition hover:bg-black"
      >
        Sign in to track this show
      </a>
    );
  }

  async function setShowStatus(next: WatchStatus) {
    setBusy(true);
    setErr(null);
    const previous = status;
    setStatus(next);
    try {
      if (previous) {
        await apiFetch(`user/shows/${showId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        });
      } else {
        await apiFetch("user/shows", {
          method: "POST",
          body: JSON.stringify({ show_id: showId, status: next }),
        });
      }
    } catch (e) {
      setStatus(previous);
      const msg = e instanceof ApiError ? e.message : "Could not update.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!status) return;
    setBusy(true);
    setErr(null);
    const previous = status;
    setStatus(null);
    try {
      await apiFetch(`user/shows/${showId}`, { method: "DELETE" });
    } catch (e) {
      setStatus(previous);
      const msg = e instanceof ApiError ? e.message : "Could not remove.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {STATUS_OPTIONS.map((opt) => {
        const active = status === opt.status;
        return (
          <button
            key={opt.status}
            type="button"
            disabled={busy}
            onClick={() => setShowStatus(opt.status)}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-paper"
                : "border-line bg-oat text-ink-2 hover:border-ink hover:text-ink"
            }`}
          >
            <span>{active ? `✓ ${opt.label}` : opt.label}</span>
            <span className="font-mono text-[10px] tracking-[0.14em] opacity-75">
              {opt.status === "Want to Watch" ? "QUEUE" : "LOG"}
            </span>
          </button>
        );
      })}

      {status && (
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="w-full rounded-lg border border-line px-4 py-2 text-xs text-muted transition hover:border-ink hover:text-ink disabled:opacity-60"
        >
          Remove from your list
        </button>
      )}

      {err && (
        <p className="text-xs text-[color:#a13b2a]" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
