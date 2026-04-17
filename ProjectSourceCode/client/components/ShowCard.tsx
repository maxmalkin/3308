import Image from "next/image";
import Link from "next/link";
import type { Show, WatchStatus } from "@/types/show";
import { posterUrl, statusPillClass, yearFrom } from "@/utils/show";

export default function ShowCard({
  show,
  status,
}: {
  show: Show;
  status?: WatchStatus;
}) {
  const title = show.name ?? show.original_name ?? "Untitled";
  const year = yearFrom(show.first_air_date);
  const topGenre = show.genres?.[0]?.name ?? null;
  const rating =
    typeof show.vote_average === "number" && show.vote_average > 0
      ? show.vote_average.toFixed(1)
      : null;
  const poster = posterUrl(show.poster_path);

  return (
    <Link
      href={`/shows/${show.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
    >
      <div className="relative w-full overflow-hidden bg-gray-100">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            width={300}
            height={450}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="h-auto w-full rounded-t-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center rounded-t-2xl bg-gray-200 text-xs text-gray-500">
            No poster
          </div>
        )}
        {rating && (
          <span className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {rating}
          </span>
        )}
        {status && (
          <span
            className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPillClass(status)}`}
          >
            {status}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-gray-900">
          {title}
        </h3>
        <p className="mt-1 truncate text-xs text-gray-500">
          {[year, topGenre].filter(Boolean).join(" \u2022 ") || "\u00A0"}
        </p>
      </div>
    </Link>
  );
}
