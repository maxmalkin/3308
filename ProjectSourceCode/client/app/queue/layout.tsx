import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Queue",
  description: "Shows that are up next on your list.",
};

export default function QueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
