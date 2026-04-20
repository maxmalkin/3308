"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/utils/api";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    const handleStorage = () => setIsLoggedIn(isAuthenticated());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-rule bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-ink"
        >
          Pillar<span className="italic text-rust">Boxd</span>
          <span className="ml-1 align-super text-[0.5rem] tracking-[0.2em] text-mute">
            ®
          </span>
        </Link>

        {isLoggedIn ? (
          <ul className="flex items-center gap-8">
            <li>
              <Link className="nav-link" href="/log">
                Log
              </Link>
            </li>
            <li>
              <Link className="nav-link" href="/queue">
                Queue
              </Link>
            </li>
            <li>
              <Link className="nav-link" href="/recommendations">
                Recommendations
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                aria-label="Account"
                className="block rounded-full ring-1 ring-rule transition hover:ring-ink"
              >
                <Image
                  src="https://placehold.co/36x36?text=A"
                  alt="Account"
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              </Link>
            </li>
          </ul>
        ) : (
          <ul className="flex items-center gap-6">
            <li>
              <Link className="nav-link" href="/login">
                Log In
              </Link>
            </li>
            <li>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
