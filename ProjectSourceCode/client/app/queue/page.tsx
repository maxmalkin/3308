"use client";

import CollectionShell from "@/components/CollectionShell";
import EmptyState from "@/components/EmptyState";
import LoginPrompt from "@/components/LoginPrompt";
import { ResourceView } from "@/components/ResourceView";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { UserShow } from "@/types/show";

export default function QueuePage() {
  const resource = useApiResource<{ shows: UserShow[] }>("user/watchlist", {
    requireAuth: true,
  });

  return (
    <ResourceView
      resource={resource}
      unauth={
        <CollectionShell
          active="queue"
          eyebrow="your queue"
          title={
            <>
              Up <em>next.</em>
            </>
          }
        >
          <LoginPrompt
            title="Log in to view your queue"
            description="You need to be signed in to see shows you've added."
          />
        </CollectionShell>
      }
      loading={
        <CollectionShell
          active="queue"
          eyebrow="your queue"
          title={
            <>
              Up <em>next.</em>
            </>
          }
        >
          <PosterGridSkeleton />
        </CollectionShell>
      }
    >
      {(data) => (
        <CollectionShell
          active="queue"
          eyebrow="your queue"
          title={
            <>
              Up <em>next.</em>
            </>
          }
          sub="Shows you've been meaning to start. Click any to open the show page or remove it from your queue."
          meta={`${data.shows.length} ${data.shows.length === 1 ? "show" : "shows"}`}
        >
          {data.shows.length === 0 ? (
            <EmptyState
              title="Your queue is empty"
              description="Add shows from search or recommendations to start tracking what you want to watch."
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {data.shows.map((show) => (
                <ShowCard key={show.id} show={show} status={show.user_status} />
              ))}
            </div>
          )}
        </CollectionShell>
      )}
    </ResourceView>
  );
}

function PosterGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
      {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((k) => (
        <div
          key={k}
          className="aspect-[2/3] animate-pulse rounded-2xl bg-oat"
        />
      ))}
    </div>
  );
}
