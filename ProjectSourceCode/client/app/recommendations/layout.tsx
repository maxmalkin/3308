import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recommendations",
  description: "Show recommendations tailored to what you've watched.",
};

export default function RecommendationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
