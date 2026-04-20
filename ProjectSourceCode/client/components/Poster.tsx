"use client";

import Image from "next/image";
import { useState } from "react";
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
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-oat text-xs text-muted ${cls}`}
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
      onLoad={() => setLoaded(true)}
      className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${cls}`}
    />
  );
}
