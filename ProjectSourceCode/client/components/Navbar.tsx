"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NavSearch from "@/components/NavSearch";
import { clearApiResourceCache } from "@/hooks/useApiResource";
import type { NavLink } from "@/types/ui";
import { clearSession, isAuthenticated } from "@/utils/api";

const LOGGED_IN_LINKS: NavLink[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/browse", label: "Browse", key: "browse" },
  { href: "/queue", label: "Queue", key: "queue" },
  { href: "/log", label: "Log", key: "log" },
  { href: "/recommendations", label: "Recs", key: "recs" },
];

const LOGGED_OUT_LINKS: NavLink[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/browse", label: "Browse", key: "browse" },
];

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
    clearApiResourceCache();
    setIsLoggedIn(false);
    window.location.assign("/");
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-rule bg-cream/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-380 grid-cols-[auto_1fr_auto] items-center gap-5 px-6 py-4 md:gap-7 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-(--accent) text-base">[</span>
          <span className="font-display text-2xl font-medium leading-none tracking-tight text-ink">
            pillar<em className="text-(--accent)">boxd</em>
          </span>
          <span className="font-mono text-(--accent) text-base">]</span>
        </Link>

        <div className="flex items-center gap-5 justify-self-center">
          <ul className="hidden items-center gap-1 text-sm lg:flex">
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
          <div className="hidden flex-1 sm:block sm:min-w-60 md:min-w-[320px]">
            <NavSearch />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          {isLoggedIn ? (
            <>
              <Link
                href="/"
                aria-label="Home"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-linear-to-br from-plum to-(--olive) font-display text-lg text-paper"
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
              <Link
                href="/settings"
                aria-label="Settings"
                className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-oat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
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
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
