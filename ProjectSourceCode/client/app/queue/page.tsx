"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ShowCard from "@/components/ShowCard";
import type { Show, WatchStatus } from "@/types/show";
import { ApiError, apiFetch, isAuthenticated } from "@/utils/api";

type PageStatus = "loading" | "unauth" | "ready" | "error";

type QueueShow = Show & { status: WatchStatus };

export default function QueuePage() {
  const [shows, setShows] = useState<QueueShow[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setPageStatus("unauth");
      return;
    }

    let cancelled = false;
    setPageStatus("loading");
    setErrorMessage(null);

    apiFetch<{ shows: QueueShow[] }>("user/watchlist")
      .then((data) => {
        if (cancelled) return;
        setShows(data?.shows ?? []);
        setPageStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setPageStatus("unauth");
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load your queue",
        );
        setPageStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Your Queue</h1>
        <p className="mb-8 text-sm text-gray-600">
          Shows that are up next on your list
        </p>

        {pageStatus === "loading" && (
          <p className="text-sm text-gray-500">Loading your queue...</p>
        )}

        {pageStatus === "unauth" && (
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">Log in to view your queue</h2>
            <p className="mt-2 text-sm text-gray-600">
              You need to be signed in to see shows you've added.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Log in
            </Link>
          </div>
        )}

        {pageStatus === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm">
              {errorMessage ?? "Please try again later."}
            </p>
          </div>
        )}

        {pageStatus === "ready" && shows.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold">Your queue is empty</h2>
            <p className="mt-2 text-sm text-gray-600">
              Add shows to your queue to start tracking what you want to watch.
            </p>
          </div>
        )}

        {pageStatus === "ready" && shows.length > 0 && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} status={show.status} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
