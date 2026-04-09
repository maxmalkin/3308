"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (pageToFetch: number) => {
    try {
      const res = await fetch(
        `/api/notifications?page=${pageToFetch}&limit=5`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (res.ok) {
        const data = await res.json();

        if (pageToFetch === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }

        setHasMore(data.pagination.page < data.pagination.totalPages);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Close dropdown on outside click
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
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-200 transition"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            Notifications
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-sm text-gray-500 text-center">
                No new notifications
              </li>
            ) : (
              <>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={`p-3 text-sm border-b border-gray-100 cursor-pointer ${notif.is_read ? "text-gray-500" : "text-black font-medium bg-blue-50"}`}
                  >
                    {notif.message}
                  </li>
                ))}

                {hasMore && (
                  <li className="p-2 text-center bg-gray-50">
                    <button
                      onClick={loadMore}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Load More...
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
