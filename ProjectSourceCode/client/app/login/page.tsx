"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { setSession } from "../../utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.session) {
        const message =
          typeof data?.error === "string" ? data.error : "Invalid credentials";
        setError(message);
        setLoading(false);
        return;
      }
      setSession(data.session);
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto flex max-w-md flex-col px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Login</h1>
          <p className="mb-6 text-sm text-gray-600">
            Sign in to access your logged shows and watchlist.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black px-4 py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link href="/register" className="font-medium text-black underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
