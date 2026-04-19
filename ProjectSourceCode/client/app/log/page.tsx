"use client";

import EmptyState from "@/components/EmptyState";
import LoginPrompt from "@/components/LoginPrompt";
import Navbar from "@/components/Navbar";
import { ResourceView } from "@/components/ResourceView";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { UserShow } from "@/types/show";

export default function LogPage() {
  const resource = useApiResource<{ shows: UserShow[] }>("user/log", {
    requireAuth: true,
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Your Log</h1>
        <p className="mb-8 text-sm text-gray-600">
          Shows you've watched or started
        </p>

        <ResourceView
          resource={resource}
          unauth={
            <LoginPrompt
              title="Log in to view your log"
              description="You need to be signed in to see the shows you've logged."
            />
          }
        >
          {(data) =>
            data.shows.length === 0 ? (
              <EmptyState
                title="Nothing logged yet"
                description="Mark shows as watched or in-progress and they'll appear here."
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
