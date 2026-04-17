"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import type { Show } from "@/types/show";
import { ApiError, apiFetch } from "@/utils/api";
import { backdropUrl, posterUrl, yearRange } from "@/utils/show";

type PageStatus = "loading" | "ready" | "notfound" | "error";

export default function ShowDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [show, setShow] = useState<Show | null>(null);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    apiFetch<{ show: Show }>(`shows/${id}`)
      .then((data) => {
        if (cancelled) return;
        if (!data?.show) {
          setStatus("notfound");
          return;
        }
        setShow(data.show);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setStatus("notfound");
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load show",
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      {status === "loading" && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm text-gray-500">Loading show...</p>
        </div>
      )}

      {status === "notfound" && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <h1 className="text-2xl font-bold">Show not found</h1>
            <p className="mt-2 text-sm text-gray-600">
              We couldn't find that show. It may have been removed.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm">
              {errorMessage ?? "Please try again later."}
            </p>
          </div>
        </div>
      )}

      {status === "ready" && show && <ShowDetail show={show} />}
    </main>
  );
}

function ShowDetail({ show }: { show: Show }) {
  const title = show.name ?? show.original_name ?? "Untitled";
  const backdrop = backdropUrl(show.backdrop_path);
  const poster = posterUrl(show.poster_path);
  const years = yearRange(show.first_air_date, show.last_air_date);
  const providers = show.watch_providers_us?.flatrate ?? [];
  const rating =
    typeof show.vote_average === "number" && show.vote_average > 0
      ? show.vote_average.toFixed(1)
      : null;
  const networks = show.networks ?? [];

  return (
    <>
      <section className="relative h-[320px] w-full overflow-hidden bg-gray-900 md:h-[420px]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-5xl items-end px-6 pb-8">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow md:text-5xl">
              {title}
            </h1>
            {show.tagline ? (
              <p className="mt-2 max-w-2xl text-sm text-white/80 italic md:text-base">
                {show.tagline}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <div className="mx-auto w-full max-w-[220px] md:mx-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {poster ? (
                <Image
                  src={poster}
                  alt={title}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500">
                  No poster
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Aired
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {years ?? "\u2014"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Seasons
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {show.number_of_seasons ?? "\u2014"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Episodes
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {show.number_of_episodes ?? "\u2014"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Rating
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {rating ? `${rating} / 10` : "\u2014"}
                  </dd>
                </div>
                {show.status ? (
                  <div className="col-span-2 md:col-span-4">
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Status
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {show.status}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {show.genres && show.genres.length > 0 ? (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Genres
                </h2>
                <div className="flex flex-wrap gap-2">
                  {show.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full bg-white px-3 py-1 text-sm text-gray-800 shadow-sm ring-1 ring-black/5"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {providers.length > 0 ? (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Streaming on
                </h2>
                <div className="flex flex-wrap gap-2">
                  {providers.map((p) => (
                    <span
                      key={p.provider_name}
                      className="rounded-full bg-gray-900 px-3 py-1 text-sm text-white"
                    >
                      {p.provider_name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {show.overview ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Overview
                </h2>
                <p className="text-sm leading-relaxed text-gray-800">
                  {show.overview}
                </p>
              </div>
            ) : null}

            {networks.length > 0 ? (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Networks
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {networks.map((n) => (
                    <li
                      key={n.name}
                      className="rounded-full bg-white px-3 py-1 text-sm text-gray-800 shadow-sm ring-1 ring-black/5"
                    >
                      {n.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
