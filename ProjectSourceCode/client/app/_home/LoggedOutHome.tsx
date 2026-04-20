"use client";

import { Skeleton } from "boneyard-js/react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useApiResource } from "@/hooks/useApiResource";
import type { ShowcaseResp } from "@/types/api";
import type { Show } from "@/types/show";
import { tmdbImageUrl } from "@/utils/show";

const BONE_PROPS = {
  animate: "shimmer",
  color: "var(--oat)",
  shimmerColor: "var(--paper)",
} as const;

export default function LoggedOutHome() {
  const showcase = useApiResource<ShowcaseResp>(
    "shows/showcase?limit=24&random=true",
  );
  const isLoading = showcase.status === "loading";
  const shows = showcase.data?.results ?? [];

  return (
    <>
      <Navbar active={undefined} />

      <main className="flex-1">
        <section className="mx-auto max-w-[1520px] px-6 md:px-12">
          <div className="grid items-end gap-8 py-10 md:grid-cols-[1.3fr_auto] md:gap-12 md:py-14">
            <div>
              <h1 className="mt-3 max-w-[16ch] text-[clamp(40px,5vw,72px)] font-medium leading-[0.98] tracking-[-0.03em]">
                Keep track of <em>what you're watching.</em>
              </h1>
              <p className="mt-5 max-w-[58ch] text-base text-ink-2">
                Track shows, queue what's next, and let recommendations meet
                your taste.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link href="/register" className="btn">
                  Start your queue
                </Link>
                <Link href="/login" className="btn-outline btn">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          <Skeleton name="showcase-strip" loading={isLoading} {...BONE_PROPS}>
            <ShowcaseStrip shows={shows} />
          </Skeleton>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Skeleton name="queue-panel" loading={isLoading} {...BONE_PROPS}>
              <QueuePanel shows={shows} />
            </Skeleton>
            <Skeleton name="recs-panel" loading={isLoading} {...BONE_PROPS}>
              <RecsPanel shows={shows} />
            </Skeleton>
            <Skeleton name="log-panel" loading={isLoading} {...BONE_PROPS}>
              <LogPanel shows={shows} />
            </Skeleton>
            <TastePanel />
          </div>
        </section>

        <Marquee />

        <section className="mx-auto max-w-[1520px] px-6 md:px-12">
          <div className="mt-9 grid items-center gap-10 rounded-2xl bg-ink px-10 py-14 text-paper md:grid-cols-[1.4fr_auto]">
            <div>
              <div className="eyebrow !text-[var(--olive-soft)]">
                ready when you are
              </div>
              <h2 className="mt-2 max-w-[24ch] text-[clamp(26px,2.8vw,40px)] font-medium leading-[1.05] tracking-[-0.03em]">
                Build a watch life you'll actually <em>remember</em>.
              </h2>
            </div>
            <Link
              href="/register"
              className="btn whitespace-nowrap !bg-cream !text-ink"
            >
              Start your queue
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function PanelShell({
  idx,
  label,
  title,
  lede,
  children,
}: {
  idx: string;
  label: string;
  title: React.ReactNode;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[360px] flex-col gap-4 rounded-[12px] border border-line bg-oat p-6">
      <div className="flex items-baseline gap-3 border-b border-line-soft pb-3">
        <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--accent)]">
          {idx}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
      </div>
      <h3 className="text-[20px] font-medium tracking-[-0.02em]">{title}</h3>
      <p className="m-0 max-w-[44ch] text-sm leading-[1.55] text-ink-2">
        {lede}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PosterTile({ show, badge }: { show: Show; badge?: string }) {
  const url = tmdbImageUrl(show.poster_path, "w300");
  const title = show.name ?? show.original_name ?? "Untitled";
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded border border-line bg-oat">
      {url ? (
        <Image
          src={url}
          alt={title}
          fill
          sizes="(max-width: 640px) 30vw, 12vw"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center px-2 text-center text-[10px] text-muted">
          {title}
        </div>
      )}
      {badge && (
        <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-paper">
          {badge}
        </span>
      )}
    </div>
  );
}

function ShowcaseStrip({ shows }: { shows: Show[] }) {
  if (shows.length === 0) return null;
  const fadeMask =
    "linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)";
  return (
    <div
      className="-mx-6 overflow-x-auto px-6 md:-mx-12 md:px-12"
      style={{
        WebkitMaskImage: fadeMask,
        maskImage: fadeMask,
      }}
    >
      <ul className="flex w-max gap-3 pb-3">
        {shows.map((s) => (
          <li key={s.id} className="w-[140px] shrink-0 sm:w-[160px]">
            <Link
              href={`/shows/${s.id}`}
              className="block transition hover:-translate-y-0.5"
              aria-label={s.name ?? s.original_name ?? "Show"}
            >
              <PosterTile show={s} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QueuePanel({ shows }: { shows: Show[] }) {
  const items = shows.slice(0, 5);
  return (
    <PanelShell
      idx="01"
      label="queue"
      title={
        <>
          The list of shows you've been <em>meaning</em> to start.
        </>
      }
      lede="Add anything with a tap. Reorder it, or let PillarBoxd pick one on indecisive nights. When you press play, it moves to your log."
    >
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {items.map((s, i) => (
          <PosterTile key={s.id} show={s} badge={`0${i + 1}`} />
        ))}
        <div className="grid aspect-[2/3] place-items-center rounded border border-dashed border-line bg-cream font-mono text-xl text-muted">
          +
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="pill-tag">tap to add</span>
        <span className="pill-tag">drag to reorder</span>
        <span className="pill-tag">shuffle when stuck</span>
      </div>
    </PanelShell>
  );
}

function RecsPanel({ shows }: { shows: Show[] }) {
  const lead = shows[0];
  const side = shows.slice(1, 4);
  if (!lead) return null;
  const backdrop = tmdbImageUrl(lead.backdrop_path, "w780");
  const title = lead.name ?? lead.original_name ?? "Untitled";
  return (
    <PanelShell
      idx="02"
      label="recs"
      title={
        <>
          Recommendations <em>you can trust.</em>
        </>
      }
      lede="Based on the shows you've rated highly."
    >
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <Link
          href={`/shows/${lead.id}`}
          className="relative block aspect-[3/2] overflow-hidden rounded-[10px] border border-line"
        >
          {backdrop ? (
            <Image
              src={backdrop}
              alt={title}
              fill
              sizes="50vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center bg-oat text-sm text-muted">
              {title}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,22,20,0.78)] to-transparent p-3.5 text-paper">
            <h4 className="mt-1 font-display text-[18px] font-medium tracking-[-0.02em]">
              {title}
            </h4>
          </div>
        </Link>
        <div className="flex flex-col gap-2">
          {side.map((s, i) => {
            const sTitle = s.name ?? s.original_name ?? "Untitled";
            return (
              <Link
                key={s.id}
                href={`/shows/${s.id}`}
                className="grid items-center gap-3 rounded-lg border border-line bg-cream p-2.5 transition hover:border-[var(--accent)] hover:bg-oat"
                style={{ gridTemplateColumns: "40px 1fr auto" }}
              >
                <div className="aspect-[2/3] w-10 overflow-hidden rounded-sm border border-line">
                  <PosterTile show={s} />
                </div>
                <div>
                  <div className="font-display text-[13px] font-medium tracking-[-0.01em]">
                    {sTitle}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-muted">
                    {s.networks?.[0]?.name ?? "Streaming"} ·{" "}
                    {s.first_air_date?.slice(0, 4) ?? "—"}
                  </div>
                </div>
                <div className="font-mono text-[11px] tracking-[0.04em] text-[var(--accent)]">
                  {92 - i * 3}%
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PanelShell>
  );
}

function LogPanel({ shows }: { shows: Show[] }) {
  const items = shows.slice(0, 4);
  return (
    <PanelShell
      idx="03"
      label="log"
      title={
        <>
          A <em>record</em> of what you've watched.
        </>
      }
      lede="Rate a show and it's filed away. Your log is the running record of every episode and season you've finished."
    >
      <div>
        {items.map((s, i) => {
          const title = s.name ?? s.original_name ?? "Untitled";
          const day = 19 - i * 2;
          const rating = Math.min(5, Math.round((s.vote_average ?? 0) / 2));
          return (
            <div
              key={s.id}
              className="grid items-center gap-3.5 border-b border-dashed border-line-soft py-2.5 last:border-0"
              style={{
                gridTemplateColumns: "52px 44px 1fr auto",
              }}
            >
              <div className="text-center font-mono text-[10px] uppercase leading-[1.3] tracking-[0.06em] text-muted">
                APR
                <b className="block font-display text-base font-medium tracking-[-0.02em] text-ink">
                  {day}
                </b>
              </div>
              <div className="aspect-[2/3] w-11 overflow-hidden rounded-sm border border-line">
                <PosterTile show={s} />
              </div>
              <div className="font-display text-[14px] font-medium tracking-[-0.015em]">
                {title}
                <span className="ml-1.5 font-mono text-[10px] font-normal text-muted">
                  S1·E{i + 3}
                </span>
              </div>
              <div className="text-sm tracking-[0.05em] text-[var(--mustard)]">
                {"★".repeat(rating)}
                <span className="text-line">{"★".repeat(5 - rating)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

function TastePanel() {
  const genres = [
    { g: "Drama", p: 42 },
    { g: "Comedy", p: 24 },
    { g: "Thriller", p: 18 },
    { g: "Sci-fi", p: 12 },
    { g: "Docs", p: 4 },
  ];
  const stats = [
    { n: 218, l: "shows tracked" },
    { n: 42, l: "logged entries" },
    { n: 14, l: "finished '26" },
    { n: 9, l: "in queue" },
  ];
  return (
    <PanelShell
      idx="04"
      label="taste"
      title={
        <>
          Your <em>shape</em>, in a glance.
        </>
      }
      lede="Genres you lean on, how much you've tracked, and what's been sitting in the queue too long."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            genre breakdown
          </h4>
          {genres.map((gb) => (
            <div
              key={gb.g}
              className="mb-2 grid items-center gap-2.5 text-xs"
              style={{ gridTemplateColumns: "90px 1fr 36px" }}
            >
              <span>{gb.g}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-oat">
                <i
                  className="block h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${gb.p}%` }}
                />
              </span>
              <span className="text-right font-mono text-[10px] tracking-[0.04em] text-muted">
                {gb.p}%
              </span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            by the numbers
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s) => (
              <div
                key={s.l}
                className="rounded-lg border border-line bg-cream px-3.5 py-3"
              >
                <div className="font-display text-[26px] font-medium leading-none tracking-[-0.02em]">
                  {s.n}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function Marquee() {
  const words: { text: string; italic?: boolean }[] = [
    { text: "track" },
    { text: "queue" },
    { text: "recommend", italic: true },
    { text: "log" },
    { text: "rate" },
    { text: "revisit" },
    { text: "organise" },
    { text: "discover", italic: true },
    { text: "remember" },
  ];
  const line = Array.from({ length: 4 }).flatMap((_, lineIdx) =>
    words.map((w, i) => (
      <span
        key={`${lineIdx}-${i}-${w.text}`}
        className="inline-flex items-center gap-[60px]"
      >
        <span
          className={
            w.italic
              ? "font-display italic text-[var(--accent)]"
              : "font-medium text-ink"
          }
        >
          {w.text}
        </span>
        <span aria-hidden>·</span>
      </span>
    )),
  );
  return (
    <div className="mt-14 overflow-hidden border-y border-line bg-oat">
      <div className="marquee-track py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <span className="inline-flex items-center gap-[60px]">{line}</span>
        <span className="inline-flex items-center gap-[60px]">{line}</span>
      </div>
    </div>
  );
}
