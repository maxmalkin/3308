import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function CollectionShell({
  active,
  eyebrow,
  title,
  sub,
  meta,
  children,
}: {
  active: string;
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <Navbar active={active} />
      <div className="mx-auto w-full max-w-[1520px] flex-1 px-6 pb-16 pt-10 md:px-12 md:pt-14">
        <div className="mb-8 flex items-baseline justify-between gap-6 border-b border-line-soft pb-5">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="mt-2 text-[clamp(34px,3.6vw,52px)] font-medium leading-[1.02] tracking-[-0.03em]">
              {title}
            </h1>
            {sub && (
              <p className="mt-2 max-w-[60ch] text-sm text-muted">{sub}</p>
            )}
          </div>
          {meta && (
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              {meta}
            </div>
          )}
        </div>
        {children}
      </div>
      <Footer />
    </main>
  );
}
