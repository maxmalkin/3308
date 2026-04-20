"use client";

import CollectionShell from "@/components/CollectionShell";
import EmptyState from "@/components/EmptyState";
import LoginPrompt from "@/components/LoginPrompt";
import { ResourceView } from "@/components/ResourceView";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { UserShow } from "@/types/show";

export default function LogPage() {
  const resource = useApiResource<{ shows: UserShow[] }>("user/log", {
    requireAuth: true,
  });

  return (
    <ResourceView
      resource={resource}
      unauth={
        <CollectionShell
          active="log"
          eyebrow="your log"
          title={
            <>
              Everything you've <em>watched.</em>
            </>
          }
        >
          <LoginPrompt
            title="Log in to view your log"
            description="You need to be signed in to see the shows you've logged."
          />
        </CollectionShell>
      }
      loading={
        <CollectionShell
          active="log"
          eyebrow="your log"
          title={
            <>
              Everything you've <em>watched.</em>
            </>
          }
        >
          <PosterGridSkeleton />
        </CollectionShell>
      }
    >
      {(data) => (
        <CollectionShell
          active="log"
          eyebrow="your log"
          title={
            <>
              Everything you've <em>watched.</em>
            </>
          }
          sub="A running record of what you've finished or started. Tap any to revisit."
          meta={`${data.shows.length} ${data.shows.length === 1 ? "entry" : "entries"}`}
        >
          {data.shows.length === 0 ? (
            <EmptyState
              title="Nothing logged yet"
              description="Mark shows as Watched or In Progress and they'll show up here."
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
          className="aspect-[2/3] animate-pulse rounded-2xl bg-paper"
        />
      ))}
    </div>
  );
}
