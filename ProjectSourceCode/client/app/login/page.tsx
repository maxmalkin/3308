"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { setSession } from "@/utils/api";

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
    <main className="flex-1 bg-cream">
      <Navbar />

      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-7 py-14 sm:px-14">
        <div className="w-full max-w-[460px]">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex gap-0.5 rounded-full bg-oat p-1">
              <button
                type="button"
                aria-selected="true"
                className="rounded-full bg-paper px-[18px] py-2 font-medium text-[13px] text-ink shadow-[0_1px_0_rgba(43,38,32,0.06),0_1px_2px_rgba(43,38,32,0.04)]"
              >
                Log in
              </button>
              <Link
                href="/register"
                className="rounded-full px-[18px] py-2 font-medium text-[13px] text-ink-2 transition hover:text-ink"
              >
                Sign up
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="text-center">
            <h1 className="mb-2.5 text-[clamp(30px,3vw,42px)] font-medium leading-[1.02] tracking-[-0.03em]">
              Welcome <em>back.</em>
            </h1>
            <p className="mx-auto mb-6 max-w-[46ch] text-sm leading-[1.55] text-ink-2">
              Pick up where you left off — your queue and log are waiting.
            </p>

            <div className="text-left">
              <Field id="email" label="Email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="auth-input"
                />
              </Field>
              <Field id="password" label="Password">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                />
              </Field>

              <div className="-mt-1 mb-5 flex items-center justify-between text-[13px]">
                <label className="inline-flex cursor-pointer items-center gap-2 text-ink-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[var(--accent)]"
                  />
                  Keep me signed in
                </label>
                <a
                  href="#"
                  className="text-ink-2 underline decoration-line underline-offset-[3px] transition hover:text-ink hover:decoration-[var(--accent)]"
                >
                  Forgot password?
                </a>
              </div>

              {error && (
                <p role="alert" className="mb-3 text-sm text-[color:#a13b2a]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-lg border border-ink bg-ink px-[18px] py-3 font-medium text-[15px] text-paper transition hover:bg-black active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Signing in…" : "Log in"}
              </button>
            </div>

            <p className="mt-6 text-xs leading-[1.5] text-muted">
              New here?{" "}
              <Link
                href="/register"
                className="text-ink-2 underline decoration-line underline-offset-[3px] hover:text-ink"
              >
                Create an account
              </Link>
              .
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="mb-3.5 block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
