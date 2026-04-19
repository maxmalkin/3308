"use client";

import EmptyState from "@/components/EmptyState";
import LoginPrompt from "@/components/LoginPrompt";
import Navbar from "@/components/Navbar";
import { ResourceView } from "@/components/ResourceView";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { Show } from "@/types/show";

type RecommendationsResponse = { results: Show[]; message?: string };

export default function RecommendationsPage() {
  const resource = useApiResource<RecommendationsResponse>(
    "shows/recommendations",
    { requireAuth: true },
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Recommended for You</h1>
        <p className="mb-8 text-sm text-gray-600">
          Based on what you've watched
        </p>

        <ResourceView
          resource={resource}
          unauth={
            <LoginPrompt
              title="Log in to see recommendations"
              description="Sign in so we can tailor picks to your taste."
            />
          }
          loading={
            <p className="text-sm text-gray-500">Finding shows for you…</p>
          }
        >
          {(data) => {
            if (data.results.length === 0 && data.message) {
              return (
                <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
                  <p className="text-sm text-gray-700">{data.message}</p>
                </div>
              );
            }
            if (data.results.length === 0) {
              return (
                <EmptyState
                  title="No recommendations yet"
                  description="Add shows to your list and we'll start suggesting things you'll love."
                />
              );
            }
            return (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {data.results.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            );
          }}
        </ResourceView>
      </div>
    </main>
  );
}
