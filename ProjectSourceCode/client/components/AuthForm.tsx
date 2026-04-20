"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  type StreamingService,
  streamingServiceValues,
} from "@/types/streaming";
import { setSession } from "@/utils/api";

import type { AuthMode } from "@/types/ui";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [services, setServices] = useState<StreamingService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleService(s: StreamingService) {
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function handleLogin() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data?.session) {
      throw new Error(
        typeof data?.error === "string" ? data.error : "Invalid credentials",
      );
    }
    setSession(data.session);
  }

  async function handleSignup() {
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
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : "Failed to create account",
      );
    }
    if (data?.session) setSession(data.session);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await handleLogin();
      else await handleSignup();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
              <ModeTab href="/login" active={mode === "login"}>
                Log in
              </ModeTab>
              <ModeTab href="/register" active={mode === "signup"}>
                Sign up
              </ModeTab>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="text-center">
            {mode === "login" ? (
              <>
                <h1 className="mb-2.5 text-[clamp(30px,3vw,42px)] font-medium leading-[1.02] tracking-[-0.03em]">
                  Welcome <em>back.</em>
                </h1>
              </>
            ) : (
              <>
                <h1 className="mb-2.5 text-[clamp(30px,3vw,42px)] font-medium leading-[1.02] tracking-[-0.03em]">
                  Make a <em>queue</em> that's yours.
                </h1>
              </>
            )}

            <div className="text-left">
              {mode === "signup" && (
                <Field id="username" label="Username">
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    minLength={1}
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="maren_chen"
                    className="auth-input"
                  />
                </Field>
              )}

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
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" ? "at least 8 characters" : "••••••••"
                  }
                  className="auth-input"
                />
              </Field>

              {mode === "login" && (
                <div className="-mt-1 mb-5 flex items-center justify-between text-[13px]">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-ink-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[var(--accent)]"
                    />
                    Keep me signed in
                  </label>
                  <button
                    type="button"
                    className="text-ink-2 underline decoration-line underline-offset-[3px] transition hover:text-ink hover:decoration-[var(--accent)]"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <fieldset className="mb-5">
                  <legend className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                    Streaming services
                  </legend>
                  <p className="mb-3 text-xs text-muted">
                    Pick the platforms you pay for so we only recommend shows
                    you can actually watch.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {streamingServiceValues.map((s) => {
                      const selected = services.includes(s);
                      return (
                        <button
                          type="button"
                          key={s}
                          onClick={() => toggleService(s)}
                          aria-pressed={selected}
                          className={`chip chip-accent ${selected ? "active" : ""}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

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
                {loading
                  ? mode === "login"
                    ? "Signing in…"
                    : "Creating account…"
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </div>

            <p className="mt-6 text-xs leading-[1.5] text-muted">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link
                    href="/register"
                    className="text-ink-2 underline decoration-line underline-offset-[3px] hover:text-ink"
                  >
                    Create an account
                  </Link>
                  .
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-ink-2 underline decoration-line underline-offset-[3px] hover:text-ink"
                  >
                    Log in
                  </Link>
                  .
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function ModeTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  if (active) {
    return (
      <span className="rounded-full bg-cream px-[18px] py-2 font-medium text-[13px] text-ink shadow-[0_1px_0_rgba(43,38,32,0.06),0_1px_2px_rgba(43,38,32,0.04)]">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full px-[18px] py-2 font-medium text-[13px] text-ink-2 transition hover:text-ink"
    >
      {children}
    </Link>
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
