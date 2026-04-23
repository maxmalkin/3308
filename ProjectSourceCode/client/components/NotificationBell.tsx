"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification } from "@/types/api";
import { apiFetch, isAuthenticated } from "@/utils/api";

type NotificationsResp = {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const POLL_INTERVAL_MS = 20_000;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pulse, setPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastUnreadRef = useRef<number | null>(null);
  const lastTopIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const fetchNotifications = useCallback(async (pageToFetch: number) => {
    if (!isAuthenticated()) return;
    try {
      const data = await apiFetch<NotificationsResp>(
        `/api/notifications?page=${pageToFetch}&limit=5`,
      );

      const newest = data.notifications[0] ?? null;
      const newestId = newest?.id ?? null;
      const prevUnread = lastUnreadRef.current;
      const prevTopId = lastTopIdRef.current;

      const isFreshArrival =
        newest !== null &&
        !newest.is_read &&
        Date.now() - new Date(newest.created_at).getTime() < 60_000;

      const hasArrival = initializedRef.current
        ? (prevUnread !== null && data.unreadCount > prevUnread) ||
          (newestId !== null && newestId !== prevTopId)
        : isFreshArrival;

      setNotifications((prev) =>
        pageToFetch === 1
          ? data.notifications
          : [...prev, ...data.notifications],
      );
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setUnreadCount(data.unreadCount);

      lastUnreadRef.current = data.unreadCount;
      lastTopIdRef.current = newestId;
      initializedRef.current = true;

      if (hasArrival) {
        setIsOpen(true);
        setPulse(true);
        setTimeout(() => setPulse(false), 2400);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
    const id = window.setInterval(() => {
      fetchNotifications(1);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch(`/api/notifications/mark-all-read`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-oat ${pulse ? "bell-pulse" : ""}`}
        aria-label="Notifications"
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
          <path d="M6 8a6 6 0 1 1 12 0c0 4.5 1.2 6.2 2 7H4c.8-.8 2-2.5 2-7Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-(--clay) px-1 font-mono text-[10px] font-semibold leading-none text-paper shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-84 overflow-hidden rounded-[10px] border border-line bg-paper shadow-[0_8px_24px_rgba(31,36,32,0.10)]">
          <div className="flex items-center justify-between border-b border-line-soft bg-oat px-4 py-3">
            <div className="eyebrow">notifications</div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-(--clay) hover:text-ink"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/settings"
                className="text-muted hover:text-ink"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
            </div>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <div className="eyebrow mb-1">all quiet</div>
                <p className="text-sm text-muted">
                  You have no notifications yet.
                </p>
              </li>
            ) : (
              <>
                {notifications.map((notif) => {
                  const when = new Date(notif.created_at);
                  const label = when.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <li
                      key={notif.id}
                      className={`group flex items-start border-b border-line-soft last:border-0 ${notif.is_read ? "bg-paper" : "bg-oat/60"}`}
                    >
                      <button
                        type="button"
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className="flex-1 px-4 py-3 text-left"
                      >
                        <div
                          className={`text-sm leading-snug ${notif.is_read ? "text-ink-2" : "font-medium text-ink"}`}
                        >
                          {notif.message}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          {label.toLowerCase()}
                          {!notif.is_read && " · new"}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNotification(notif.id)}
                        aria-label="Delete notification"
                        className="mx-2 my-3 h-6 w-6 flex-none rounded-full text-muted opacity-0 transition hover:bg-line hover:text-ink group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}

                {hasMore && (
                  <li className="border-t border-line-soft bg-oat/40 p-2 text-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--clay) hover:text-ink"
                    >
                      Load more ↓
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
