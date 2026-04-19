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
    <nav className="border-b bg-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold">
        PillarBoxd
      </Link>

      {isLoggedIn ? (
        <ul className="flex items-center gap-6">
          <li className="nav-item">
            <Link className="nav-link" href="/log">Log</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/queue">Queue</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/recommendations">Recommendations</Link>
          </li>
          <li className="nav-item">
            <Link href="/account">
              <Image
                src="https://placehold.co/36x36?text=A"
                alt="Account"
                width={36}
                height={36}
                style={{ borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
              />
            </Link>
          </li>
        </ul>
      ) : (
        <ul className="flex items-center gap-6">
          <li>
            <Link className="nav-link" href="/login">Log In</Link>
          </li>
          <li>
            <Link href="/register" className="btn btn-outline-light">Register</Link>
          </li>
        </ul>
      )}
    </nav>
  );
}