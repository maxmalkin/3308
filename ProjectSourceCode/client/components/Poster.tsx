import Image from "next/image";
import type { Show } from "@/types/show";
import { type TMDBImageSize, tmdbImageUrl } from "@/utils/show";

export default function Poster({
  show,
  size,
  sizes,
  priority,
  className,
}: {
  show: Pick<Show, "poster_path" | "name" | "original_name">;
  size: TMDBImageSize;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const url = tmdbImageUrl(show.poster_path, size);
  const alt = show.name ?? show.original_name ?? "Untitled";
  const cls = className ?? "";

  if (!url) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500 ${cls}`}
      >
        No poster
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes ?? "25vw"}
      priority={priority}
      className={`object-cover ${cls}`}
    />
  );
}
