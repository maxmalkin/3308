"use client";

import { useEffect, useState } from "react";
import { clearApiResourceCache, useApiResource } from "@/hooks/useApiResource";
import type { WatchStatus } from "@/types/show";
import { ApiError, apiFetch, isAuthenticated } from "@/utils/api";

const STATUS_OPTIONS: { status: WatchStatus; label: string }[] = [
  { status: "Want to Watch", label: "Add to queue" },
  { status: "In Progress", label: "Watching" },
  { status: "Watched", label: "Mark watched" },
];

export default function ActionBar({ showId }: { showId: number }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const me = useApiResource<{ status: WatchStatus | null }>(
    authed ? `user/shows/${showId}` : null,
    { requireAuth: true },
  );

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  useEffect(() => {
    if (me.data) setStatus(me.data.status);
  }, [me.data]);

  if (authed === false) {
    return (
      <a
        href="/login"
        className="block w-full rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-paper transition hover:bg-black"
      >
        Sign in to track this show
      </a>
    );
  }

  async function setShowStatus(next: WatchStatus) {
    setBusy(true);
    setErr(null);
    const previous = status;
    setStatus(next);
    try {
      if (previous) {
        await apiFetch(`user/shows/${showId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        });
      } else {
        await apiFetch("user/shows", {
          method: "POST",
          body: JSON.stringify({ show_id: showId, status: next }),
        });
      }
      clearApiResourceCache("user/");
    } catch (e) {
      setStatus(previous);
      const msg = e instanceof ApiError ? e.message : "Could not update.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!status) return;
    setBusy(true);
    setErr(null);
    const previous = status;
    setStatus(null);
    try {
      await apiFetch(`user/shows/${showId}`, { method: "DELETE" });
      clearApiResourceCache("user/");
    } catch (e) {
      setStatus(previous);
      const msg = e instanceof ApiError ? e.message : "Could not remove.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {STATUS_OPTIONS.map((opt) => {
        const active = status === opt.status;
        return (
          <button
            key={opt.status}
            type="button"
            disabled={busy}
            onClick={() => setShowStatus(opt.status)}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? "border-(--accent) bg-(--accent) text-paper"
                : "border-line bg-oat text-ink-2 hover:border-ink hover:text-ink"
            }`}
          >
            <span>{active ? `✓ ${opt.label}` : opt.label}</span>
            <span className="font-mono text-[10px] tracking-[0.14em] opacity-75">
              {opt.status === "Want to Watch" ? "QUEUE" : "LOG"}
            </span>
          </button>
        );
      })}

      {status && (
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="w-full rounded-lg border border-line px-4 py-2 text-xs text-muted transition hover:border-ink hover:text-ink disabled:opacity-60"
        >
          Remove from your list
        </button>
      )}

      {err && (
        <p className="text-xs text-[color:#a13b2a]" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
