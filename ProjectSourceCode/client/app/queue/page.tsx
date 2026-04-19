"use client";

import EmptyState from "@/components/EmptyState";
import LoginPrompt from "@/components/LoginPrompt";
import Navbar from "@/components/Navbar";
import { ResourceView } from "@/components/ResourceView";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { UserShow } from "@/types/show";

export default function QueuePage() {
  const resource = useApiResource<{ shows: UserShow[] }>("user/watchlist", {
    requireAuth: true,
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Your Queue</h1>
        <p className="mb-8 text-sm text-gray-600">
          Shows that are up next on your list
        </p>

        <ResourceView
          resource={resource}
          unauth={
            <LoginPrompt
              title="Log in to view your queue"
              description="You need to be signed in to see shows you've added."
            />
          }
        >
          {(data) =>
            data.shows.length === 0 ? (
              <EmptyState
                title="Your queue is empty"
                description="Add shows to your queue to start tracking what you want to watch."
              />
            ) : (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {data.shows.map((show) => (
                  <ShowCard
                    key={show.id}
                    show={show}
                    status={show.user_status}
                  />
                ))}
              </div>
            )
          }
        </ResourceView>
      </div>
    </main>
  );
}
