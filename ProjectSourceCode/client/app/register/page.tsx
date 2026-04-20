"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import {
  type StreamingService,
  streamingServiceValues,
} from "../../types/streaming";
import { setSession } from "../../utils/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [services, setServices] = useState<StreamingService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleService(service: StreamingService) {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          owned_services: services,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Failed to create account";
        setError(message);
        setLoading(false);
        return;
      }
      if (data?.session) {
        setSession(data.session);
      }
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
          <h1 className="mb-2 text-3xl font-bold">Create Account</h1>
          <p className="mb-6 text-sm text-gray-600">
            Sign up to start logging shows and building your watchlist.
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
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={1}
                maxLength={32}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <fieldset>
              <legend className="mb-2 block text-sm font-medium">
                Streaming services
              </legend>
              <p className="mb-3 text-xs text-gray-500">
                Pick the platforms you have so we can tailor recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                {streamingServiceValues.map((service) => {
                  const selected = services.includes(service);
                  return (
                    <button
                      type="button"
                      key={service}
                      onClick={() => toggleService(service)}
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        selected
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:border-gray-500"
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </fieldset>

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
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-black underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
