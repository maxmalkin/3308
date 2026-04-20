import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Log",
  description: "Shows you've watched or started.",
};

export default function LogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
