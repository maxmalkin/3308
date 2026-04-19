import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/shows/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      show?: { name?: string; original_name?: string; overview?: string };
    };
    const title = data.show?.name ?? data.show?.original_name ?? "Show Details";
    return {
      title,
      description: data.show?.overview ?? "Details, cast, and streaming info for this show.",
    };
  } catch {
    return {
      title: "Show Details",
      description: "Details, cast, and streaming info for this show.",
    };
  }
}

export default function ShowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
