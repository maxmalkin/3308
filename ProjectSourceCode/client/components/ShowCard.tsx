import Image from "next/image";
import Link from "next/link";
import type { Show } from "@/data/shows";

export default function ShowCard({ show }: { show: Show }) {
  return (
    <Link href={`/shows/${show.id}`} className="block w-[180px]">
      <Image
        src={show.image}
        alt={show.title}
        width={180}
        height={270}
        className="rounded-lg mb-2"
      />
      <h3 className="font-semibold">{show.title}</h3>
      <p className="text-sm text-gray-500">
        {show.year} • {show.platform}
      </p>
    </Link>
  );
}
