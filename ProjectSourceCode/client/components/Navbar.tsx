"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, isAuthenticated } from "@/utils/api";

type NavLink = { href: string; label: string; key: string };

const LOGGED_IN_LINKS: NavLink[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/queue", label: "Queue", key: "queue" },
  { href: "/log", label: "Log", key: "log" },
  { href: "/recommendations", label: "Recs", key: "recs" },
];

const LOGGED_OUT_LINKS: NavLink[] = [{ href: "/", label: "Home", key: "home" }];

export default function Navbar({ active }: { active?: string } = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    const handleStorage = () => setIsLoggedIn(isAuthenticated());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const links = isLoggedIn ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

  function handleSignOut() {
    clearSession();
    setIsLoggedIn(false);
    window.location.assign("/");
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-rule bg-cream/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1520px] grid-cols-[auto_1fr_auto] items-center gap-7 px-6 py-4 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-[var(--accent)] text-base">[</span>
          <span className="font-display text-2xl font-medium leading-none tracking-tight text-ink">
            pillar<em className="text-[var(--accent)]">boxd</em>
          </span>
          <span className="font-mono text-[var(--accent)] text-base">]</span>
        </Link>

        <ul className="hidden items-center justify-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className={`nav-link ${active === l.key ? "active" : ""}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 justify-self-end">
          {isLoggedIn ? (
            <>
              <Link
                href="/account"
                aria-label="Account"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-gradient-to-br from-[var(--plum)] to-[var(--olive)] font-display text-lg text-paper"
              >
                M
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-outline btn hidden px-3 py-1.5 text-xs sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-outline btn hidden px-3.5 py-2 text-xs sm:inline-flex"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn px-4 py-2 text-xs">
                Get PillarBoxd
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
