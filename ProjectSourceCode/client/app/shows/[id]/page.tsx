"use client";

import Image from "next/image";
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

export default function ShowDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;
  const resource = useApiResource<ShowResp>(id ? `shows/${id}` : null);

  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <div className="flex-1">
        <ResourceView
          resource={resource}
          loading={
            <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-12">
              <div className="h-80 animate-pulse rounded-2xl bg-paper" />
            </div>
          }
          errorView={(err) => (
            <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-12">
              {err?.status === 404 ? (
                <div className="rounded-2xl border border-line bg-paper p-8">
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
              <ShowDetail show={data.show} />
            ) : (
              <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-12">
                <div className="rounded-2xl border border-line bg-paper p-8">
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
            <div className="mb-6 lg:pt-12">
              <h1 className="font-display text-[clamp(48px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.03em]">
                {title}
              </h1>
              {show.tagline && (
                <p className="mt-3 max-w-[60ch] font-display text-lg italic text-ink-2">
                  "{show.tagline}"
                </p>
              )}
            </div>

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
              <section className="mb-8">
                <div className="eyebrow mb-3">Overview</div>
                <p className="max-w-[68ch] text-[15px] leading-[1.65] text-ink-2">
                  {show.overview}
                </p>
              </section>
            )}

            {show.genres && show.genres.length > 0 && (
              <section className="mb-8">
                <div className="eyebrow mb-3">Genres</div>
                <div className="flex flex-wrap gap-2">
                  {show.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink-2"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {show.status && (
              <section>
                <div className="eyebrow mb-1">Status</div>
                <p className="text-sm text-ink-2">{show.status}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
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
    <div className="bg-paper px-4 py-4">
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
                : "border-line bg-paper text-ink-2 hover:border-ink hover:text-ink"
            }`}
          >
            <span>{active ? `✓ ${opt.label}` : opt.label}</span>
            <span className="font-mono text-[10px] tracking-[0.14em] opacity-75">
              {opt.status === "Want to Watch"
                ? "QUEUE"
                : opt.status === "In Progress"
                  ? "LOG"
                  : "LOG"}
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
