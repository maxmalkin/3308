"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { clearApiResourceCache } from "@/hooks/useApiResource";
import type { Profile } from "@/types/api";
import { streamingServiceValues } from "@/types/streaming";
import { apiFetch, isAuthenticated } from "@/utils/api";

type NotificationSettings = {
  user_id: string;
  episode_alerts: boolean;
  reply_alerts: boolean;
  updated_at: string;
};

type SettingsResp = { settings: NotificationSettings };

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [episodeAlerts, setEpisodeAlerts] = useState(true);
  const [replyAlerts, setReplyAlerts] = useState(true);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSavedAt, setProfileSavedAt] = useState<number | null>(null);

  const [notifSaving, setNotifSaving] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifSavedAt, setNotifSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [profile, notif] = await Promise.all([
          apiFetch<Profile>("user/profile"),
          apiFetch<SettingsResp>("notifications/settings"),
        ]);
        if (cancelled) return;
        setUsername(profile.user.username);
        setEmail(profile.user.email ?? "");
        setServices(
          Array.isArray(profile.user.owned_services)
            ? (profile.user.owned_services as string[])
            : [],
        );
        setEpisodeAlerts(notif.settings.episode_alerts);
        setReplyAlerts(notif.settings.reply_alerts);
      } catch (err) {
        if (!cancelled) {
          setProfileError(
            err instanceof Error ? err.message : "Failed to load settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggleService(name: string) {
    setServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    try {
      await apiFetch("user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          username: username.trim(),
          owned_services: services,
        }),
      });
      clearApiResourceCache("user/profile");
      setProfileSavedAt(Date.now());
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Could not save profile.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleNotifSave(e: FormEvent) {
    e.preventDefault();
    setNotifSaving(true);
    setNotifError(null);
    try {
      await apiFetch("notifications/settings", {
        method: "PATCH",
        body: JSON.stringify({
          episode_alerts: episodeAlerts,
          reply_alerts: replyAlerts,
        }),
      });
      setNotifSavedAt(Date.now());
    } catch (err) {
      setNotifError(
        err instanceof Error ? err.message : "Could not save preferences.",
      );
    } finally {
      setNotifSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-7 md:px-12">
          <header className="pb-6">
            <div className="eyebrow">your account</div>
            <h1 className="mt-2 font-display text-[clamp(32px,3.6vw,46px)] font-medium leading-[1.04] tracking-[-0.03em]">
              Settings
            </h1>
            <p className="mt-2 max-w-[54ch] text-sm text-muted">
              Update your profile, the streaming services you own, and how you'd
              like to hear from us.
            </p>
          </header>

          {loading ? (
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-[14px] bg-oat" />
              <div className="h-32 animate-pulse rounded-[14px] bg-oat" />
            </div>
          ) : (
            <div className="space-y-10">
              <section className="rounded-[14px] border border-line bg-oat p-6">
                <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line-soft pb-3">
                  <div>
                    <div className="eyebrow">profile</div>
                    <h2 className="mt-0.5 font-display text-xl font-medium tracking-[-0.02em]">
                      Account details
                    </h2>
                  </div>
                  {profileSavedAt && !profileSaving && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--clay)">
                      ✓ saved
                    </span>
                  )}
                </div>
                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                    >
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={1}
                      maxLength={32}
                      className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-(--clay) focus:ring-2 focus:ring-(--clay-soft)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full rounded-md border border-line-soft bg-paper/70 px-3 py-2 text-sm text-muted"
                    />
                  </div>

                  {profileError && <ErrorBanner message={profileError} />}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={profileSaving || username.trim().length === 0}
                      className="btn btn-primary"
                    >
                      {profileSaving ? "Saving…" : "Save profile"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-[14px] border border-line bg-oat p-6">
                <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line-soft pb-3">
                  <div>
                    <div className="eyebrow">streaming</div>
                    <h2 className="mt-0.5 font-display text-xl font-medium tracking-[-0.02em]">
                      Services you own
                    </h2>
                  </div>
                  {profileSavedAt && !profileSaving && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--clay)">
                      ✓ saved
                    </span>
                  )}
                </div>
                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {streamingServiceValues.map((svc) => {
                        const active = services.includes(svc);
                        return (
                          <button
                            type="button"
                            key={svc}
                            onClick={() => toggleService(svc)}
                            className={`chip ${active ? "active" : ""}`}
                          >
                            {active ? "✓ " : "+ "}
                            {svc}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      We use this to tailor your recommendations to what you can
                      actually watch.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="btn btn-primary"
                    >
                      {profileSaving ? "Saving…" : "Save services"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-[14px] border border-line bg-oat p-6">
                <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line-soft pb-3">
                  <div>
                    <div className="eyebrow">notifications</div>
                    <h2 className="mt-0.5 font-display text-xl font-medium tracking-[-0.02em]">
                      What we ping you about
                    </h2>
                  </div>
                  {notifSavedAt && !notifSaving && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--clay)">
                      ✓ saved
                    </span>
                  )}
                </div>

                <form onSubmit={handleNotifSave} className="space-y-4">
                  <ToggleRow
                    label="Episode alerts"
                    description="New episodes for shows you're tracking."
                    checked={episodeAlerts}
                    onChange={setEpisodeAlerts}
                  />
                  <ToggleRow
                    label="Reply alerts"
                    description="Replies and mentions on your activity."
                    checked={replyAlerts}
                    onChange={setReplyAlerts}
                  />

                  {notifError && <ErrorBanner message={notifError} />}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={notifSaving}
                      className="btn btn-primary"
                    >
                      {notifSaving ? "Saving…" : "Save preferences"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-line-soft bg-paper px-4 py-3 transition hover:border-line">
      <span>
        <span className="block font-display text-base font-medium tracking-[-0.01em] text-ink">
          {label}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full border transition ${checked ? "border-(--clay) bg-(--clay)" : "border-ink-2/30 bg-ink-2/20"}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`inline-block h-5 w-5 transform rounded-full shadow transition ${checked ? "translate-x-5 bg-paper" : "translate-x-0.5 bg-ink"}`}
        />
      </span>
    </label>
  );
}
