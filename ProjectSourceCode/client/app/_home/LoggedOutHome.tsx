"use client";

import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

type Stub = {
  id: string;
  title: string;
  year: string;
  network: string;
  genre: string;
  hue: number;
};

const STUBS: Stub[] = [
  {
    id: "severance",
    title: "Severance",
    year: "2022",
    network: "Apple TV+",
    genre: "Thriller",
    hue: 200,
  },
  {
    id: "the-bear",
    title: "The Bear",
    year: "2022",
    network: "FX",
    genre: "Drama",
    hue: 18,
  },
  {
    id: "fleabag",
    title: "Fleabag",
    year: "2016",
    network: "BBC",
    genre: "Comedy",
    hue: 350,
  },
  {
    id: "shogun",
    title: "Shōgun",
    year: "2024",
    network: "FX",
    genre: "History",
    hue: 30,
  },
  {
    id: "better-call-saul",
    title: "Better Call Saul",
    year: "2015",
    network: "AMC",
    genre: "Crime",
    hue: 50,
  },
  {
    id: "dark",
    title: "Dark",
    year: "2017",
    network: "Netflix",
    genre: "Sci-Fi",
    hue: 250,
  },
];

const TABS = [
  { id: "queue", idx: "01", label: "Queue" },
  { id: "log", idx: "02", label: "Log" },
  { id: "recs", idx: "03", label: "Recs" },
  { id: "taste", idx: "04", label: "Taste" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LoggedOutHome() {
  const [tab, setTab] = useState<TabId>("queue");

  return (
    <>
      <Navbar active="home" />

      <main className="flex-1">
        <section className="mx-auto max-w-[1520px] px-6 md:px-12">
          <div className="grid min-h-[calc(100vh-72px)] gap-11 py-6 lg:grid-cols-[minmax(420px,1.05fr)_minmax(0,1.25fr)] lg:py-10">
            <div className="flex flex-col">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <div className="eyebrow">
                    a tidy home for everything you watch
                  </div>
                  <h1 className="mt-3 text-[clamp(36px,4vw,58px)] font-medium leading-[0.98] tracking-[-0.03em]">
                    A quieter way to
                    <br />
                    keep track of
                    <br />
                    <em>what you're watching.</em>
                  </h1>
                </div>
                <div className="hidden whitespace-nowrap pb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted lg:block">
                  No · 001
                  <br />
                  since 2026
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link href="/register" className="btn">
                  Start your queue
                </Link>
                <Link href="/login" className="btn-outline btn">
                  Sign in
                </Link>
                <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  free · no ads
                </span>
              </div>

              <div
                role="tablist"
                className="mt-7 flex items-stretch gap-0.5 border-b border-line"
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`-mb-px inline-flex items-baseline gap-2 border-b-2 px-3.5 pb-3.5 pt-3 text-[13px] font-medium transition ${
                      tab === t.id
                        ? "border-[var(--accent)] text-ink"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] tracking-[0.15em] ${tab === t.id ? "text-[var(--accent)]" : "text-muted"}`}
                    >
                      {t.idx}
                    </span>
                    {t.label}
                  </button>
                ))}
                <div className="ml-auto inline-flex items-center gap-2 px-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  live preview
                </div>
              </div>

              <div className="flex min-h-[360px] flex-1 flex-col gap-4 rounded-b-[var(--radius-lg)] border border-t-0 border-line bg-paper p-6">
                {tab === "queue" && <QueuePreview />}
                {tab === "log" && <LogPreview />}
                {tab === "recs" && <RecsPreview />}
                {tab === "taste" && <TastePreview />}
              </div>
            </div>

            <div className="relative hidden min-h-[520px] self-end lg:block">
              <div className="absolute left-0 top-2 flex items-center gap-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                the shelf
                <span className="h-px w-12 bg-line" />
              </div>
              <PosterWall />
            </div>
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
              className="btn whitespace-nowrap !bg-paper !text-ink"
            >
              Start your queue — free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function StubPoster({ stub, badge }: { stub: Stub; badge?: string }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[var(--radius)]"
      style={{
        background: `linear-gradient(140deg, hsl(${stub.hue} 28% 32%) 0%, hsl(${stub.hue} 38% 18%) 100%)`,
      }}
    >
      <div className="absolute inset-0 grid grid-rows-[1fr_auto] p-3 text-paper">
        <div />
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] opacity-70">
            {stub.network} · {stub.year}
          </span>
          <span className="font-display text-[15px] leading-[1.05] tracking-tight">
            {stub.title}
          </span>
        </div>
      </div>
      {badge && (
        <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-paper">
          {badge}
        </span>
      )}
    </div>
  );
}

function QueuePreview() {
  return (
    <>
      <h3 className="text-[22px] font-medium tracking-[-0.02em]">
        The list of shows you've been <em>meaning</em> to start.
      </h3>
      <p className="m-0 max-w-[56ch] text-sm leading-[1.55] text-ink-2">
        Add anything with a tap. Reorder it, or let PillarBoxd pick one on
        indecisive nights. When you press play, it moves to your log.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STUBS.slice(0, 5).map((s, i) => (
          <div
            key={s.id}
            className="aspect-[2/3] cursor-pointer rounded border border-line transition hover:-translate-y-0.5"
          >
            <StubPoster stub={s} badge={`0${i + 1}`} />
          </div>
        ))}
        <div className="grid aspect-[2/3] place-items-center rounded border border-dashed border-line bg-cream font-mono text-xl text-muted">
          +
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <span className="pill-tag">tap to add</span>
        <span className="pill-tag">drag to reorder</span>
        <span className="pill-tag">shuffle when stuck</span>
      </div>
    </>
  );
}

function LogPreview() {
  const rows = [
    { stub: STUBS[0], season: 1, episode: 6, day: 19, rating: 5 },
    { stub: STUBS[1], season: 2, episode: 4, day: 17, rating: 4 },
    { stub: STUBS[3], season: 1, episode: 8, day: 15, rating: 5 },
    { stub: STUBS[4], season: 6, episode: 13, day: 12, rating: 5 },
  ];
  return (
    <>
      <h3 className="text-[22px] font-medium tracking-[-0.02em]">
        A <em>record</em> of what you've watched.
      </h3>
      <p className="m-0 max-w-[56ch] text-sm leading-[1.55] text-ink-2">
        Rate a show and it's filed away. Your log is the running record of every
        episode and season you've finished.
      </p>
      <div className="flex flex-col">
        {rows.map((r) => (
          <div
            key={r.stub.id}
            className="grid items-center gap-3.5 border-b border-dashed border-line-soft py-2.5 last:border-0"
            style={{ gridTemplateColumns: "52px 44px 1fr auto" }}
          >
            <div className="text-center font-mono text-[10px] uppercase leading-[1.3] tracking-[0.06em] text-muted">
              APR
              <b className="block font-medium font-display text-base tracking-[-0.02em] text-ink">
                {r.day}
              </b>
            </div>
            <div className="aspect-[2/3] w-11 overflow-hidden rounded-sm border border-line">
              <StubPoster stub={r.stub} />
            </div>
            <div className="font-display text-[15px] font-medium tracking-[-0.015em]">
              {r.stub.title}
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted">
                S{r.season}·E{r.episode}
              </span>
            </div>
            <div className="text-sm tracking-[0.05em] text-[var(--mustard)]">
              {"★".repeat(r.rating)}
              <span className="text-line">{"★".repeat(5 - r.rating)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RecsPreview() {
  const lead = STUBS[3];
  const side = STUBS.slice(0, 3);
  return (
    <>
      <h3 className="text-[22px] font-medium tracking-[-0.02em]">
        Recommendations <em>you can trust.</em>
      </h3>
      <p className="m-0 max-w-[56ch] text-sm leading-[1.55] text-ink-2">
        Based on the shows you've rated highly — not on what a studio paid us to
        surface.
      </p>
      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-[3/2] cursor-pointer overflow-hidden rounded-[10px] border border-line">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(140deg, hsl(${lead.hue} 28% 26%), hsl(${lead.hue} 38% 14%))`,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,22,20,0.78)] to-transparent p-4 text-paper">
            <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--olive-soft)]">
              94% MATCH · BECAUSE YOU LOVED BETTER CALL SAUL
            </div>
            <h4 className="mt-1 font-display text-[22px] font-medium tracking-[-0.02em]">
              {lead.title}
            </h4>
            <div className="mt-1 text-xs text-paper/80">
              {lead.network} · {lead.year} · {lead.genre}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {side.map((s, i) => (
            <div
              key={s.id}
              className="grid cursor-pointer items-center gap-3 rounded-lg border border-line bg-cream p-2.5 transition hover:border-[var(--accent)] hover:bg-paper"
              style={{ gridTemplateColumns: "40px 1fr auto" }}
            >
              <div className="aspect-[2/3] w-10 overflow-hidden rounded-sm border border-line">
                <StubPoster stub={s} />
              </div>
              <div>
                <div className="font-display text-[13px] font-medium tracking-[-0.01em]">
                  {s.title}
                </div>
                <div className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-muted">
                  {s.network} · {s.year}
                </div>
              </div>
              <div className="font-mono text-[11px] tracking-[0.04em] text-[var(--accent)]">
                {92 - i * 3}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TastePreview() {
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
    <>
      <h3 className="text-[22px] font-medium tracking-[-0.02em]">
        Your <em>shape</em>, in a glance.
      </h3>
      <p className="m-0 max-w-[56ch] text-sm leading-[1.55] text-ink-2">
        Genres you lean on, how much you've tracked, and what's been sitting in
        the queue too long.
      </p>
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
                <div className="font-display text-[30px] font-medium leading-none tracking-[-0.02em]">
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
    </>
  );
}

function PosterWall() {
  const layout = [
    { stub: STUBS[0], cls: "w-[180px] left-0 top-[10px] -rotate-[5deg] z-[2]" },
    {
      stub: STUBS[1],
      cls: "w-[200px] left-[150px] top-[70px] rotate-[2deg] z-[4]",
    },
    {
      stub: STUBS[2],
      cls: "w-[180px] left-[320px] top-0 -rotate-[3deg] z-[3]",
    },
    {
      stub: STUBS[3],
      cls: "w-[170px] left-[60px] top-[290px] rotate-[4deg] z-[2]",
    },
    {
      stub: STUBS[4],
      cls: "w-[200px] left-[220px] top-[310px] -rotate-[2deg] z-[5]",
    },
    {
      stub: STUBS[5],
      cls: "w-[170px] left-[410px] top-[270px] rotate-[6deg] z-[2]",
    },
  ];
  return (
    <div className="absolute inset-x-0 top-10 bottom-0">
      <span
        className="absolute left-[230px] top-[50px] z-[7] h-[22px] w-[84px] -rotate-[14deg] border border-dashed"
        style={{
          background: "color-mix(in oklab, var(--mustard) 70%, transparent)",
          borderColor: "color-mix(in oklab, var(--mustard) 80%, #000 10%)",
        }}
      />
      <span
        className="absolute left-[380px] top-[340px] z-[7] h-[22px] w-[84px] rotate-[10deg] border border-dashed"
        style={{
          background: "color-mix(in oklab, var(--mustard) 70%, transparent)",
          borderColor: "color-mix(in oklab, var(--mustard) 80%, #000 10%)",
        }}
      />
      {layout.map(({ stub, cls }) => (
        <div
          key={stub.id}
          className={`absolute aspect-[2/3] overflow-hidden rounded-lg border border-line cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:rotate-0 hover:scale-[1.02] hover:z-20 ${cls}`}
          style={{
            boxShadow:
              "0 20px 40px -18px rgba(36,35,31,0.3), 0 1px 2px rgba(36,35,31,0.14)",
          }}
        >
          <StubPoster stub={stub} />
        </div>
      ))}
      <div
        className="absolute left-[178px] top-[200px] z-[6] grid h-[118px] w-[118px] -rotate-[8deg] place-items-center rounded-full border-2 border-ink bg-[var(--olive)] text-center font-display text-[13px] font-medium uppercase tracking-[0.04em] leading-tight text-paper"
        style={{ boxShadow: "0 8px 24px rgba(36,35,31,0.22)" }}
      >
        <span>
          your
          <br />
          <b className="block font-mono text-xl font-medium tracking-[0.06em]">
            queue
          </b>
          <br />
          awaits
        </span>
      </div>
    </div>
  );
}

function Marquee() {
  const words = [
    "track",
    "queue",
    "<i>recommend</i>",
    "log",
    "rate",
    "revisit",
    "organise",
    "<i>discover</i>",
    "remember",
  ];
  const line = words.map((w) => `<b>${w}</b>`).join(" · ");
  const repeated = `${line} · ${line} · ${line} · ${line}`;
  return (
    <div className="mt-5 overflow-hidden border-y border-line bg-paper">
      <div
        className="marquee-track py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        dangerouslySetInnerHTML={{
          __html: `<span>${repeated}</span><span>${repeated}</span>`,
        }}
      />
    </div>
  );
}
