"use client";

import CollectionShell from "@/components/CollectionShell";
import EmptyState from "@/components/EmptyState";
import LoginPrompt from "@/components/LoginPrompt";
import { ResourceView } from "@/components/ResourceView";
import ShowCard from "@/components/ShowCard";
import { useApiResource } from "@/hooks/useApiResource";
import type { Show } from "@/types/show";

type RecommendationsResponse = {
  results: Show[];
  message?: string;
  source?: "embedding" | "popular";
};

export default function RecommendationsPage() {
  const resource = useApiResource<RecommendationsResponse>(
    "shows/recommendations",
    { requireAuth: true },
  );

  return (
    <ResourceView
      resource={resource}
      unauth={
        <CollectionShell
          active="recs"
          eyebrow="for you"
          title={
            <>
              Recommendations <em>you can trust.</em>
            </>
          }
        >
          <LoginPrompt
            title="Log in to see recommendations"
            description="Sign in so we can tailor picks to your taste."
          />
        </CollectionShell>
      }
      loading={
        <CollectionShell
          active="recs"
          eyebrow="for you"
          title={
            <>
              Recommendations <em>you can trust.</em>
            </>
          }
        >
          <PosterGridSkeleton />
        </CollectionShell>
      }
    >
      {(data) => {
        const isPopular = data.source === "popular";
        const eyebrow = isPopular ? "popular this season" : "for you";
        const sub = isPopular
          ? "We're starting you off with what people are watching. Add a few shows to your log and these will tune to your taste."
          : "Picked from the shows in your log — closer to your taste than anything a studio paid for.";
        const title = isPopular ? (
          <>
            Picked <em>to start.</em>
          </>
        ) : (
          <>
            Recommendations <em>you can trust.</em>
          </>
        );
        return (
          <CollectionShell
            active="recs"
            eyebrow={eyebrow}
            title={title}
            sub={sub}
            meta={`${data.results.length} ${data.results.length === 1 ? "show" : "shows"}`}
          >
            {data.results.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                description={
                  data.message ??
                  "Add shows to your list and we'll start suggesting things you'll love."
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {data.results.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            )}
          </CollectionShell>
        );
      }}
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
