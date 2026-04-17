"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ShowCard from "@/components/ShowCard";
import type { Show } from "@/types/show";
import { ApiError, apiFetch, isAuthenticated } from "@/utils/api";

type PageStatus = "loading" | "unauth" | "ready" | "error";

export default function RecommendationsPage() {
  const [results, setResults] = useState<Show[]>([]);
  const [message, setMessage] = useState<string | null>(null);
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

    apiFetch<{ results: Show[]; message?: string }>("shows/recommendations")
      .then((data) => {
        if (cancelled) return;
        setResults(data?.results ?? []);
        setMessage(data?.message ?? null);
        setPageStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setPageStatus("unauth");
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load recommendations",
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
        <h1 className="mb-2 text-3xl font-bold">Recommended for You</h1>
        <p className="mb-8 text-sm text-gray-600">
          Based on what you've watched
        </p>

        {pageStatus === "loading" && (
          <p className="text-sm text-gray-500">Finding shows for you...</p>
        )}

        {pageStatus === "unauth" && (
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">
              Log in to see recommendations
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in so we can tailor picks to your taste.
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

        {pageStatus === "ready" && results.length === 0 && message && (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {pageStatus === "ready" && results.length === 0 && !message && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold">No recommendations yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Add shows to your list and we'll start suggesting things you'll
              love.
            </p>
          </div>
        )}

        {pageStatus === "ready" && results.length > 0 && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {results.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
