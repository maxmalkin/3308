"use client";

import { useEffect, useState } from "react";
import { isAuthenticated } from "@/utils/api";
import LoggedInHome from "./_home/LoggedInHome";
import LoggedOutHome from "./_home/LoggedOutHome";

export default function Home() {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setAuth(isAuthenticated());
    const sync = () => setAuth(isAuthenticated());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  if (auth === null) return <div className="min-h-screen bg-cream" />;
  return auth ? <LoggedInHome /> : <LoggedOutHome />;
}
