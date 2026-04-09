"use client"; // This tells Next.js this is an interactive client-side component

import { useEffect, useState } from "react";

// Define the shape of the data we expect from your Hono server
type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch the data when the bell loads
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetching from your Hono backend!
        const res = await fetch("http://localhost:8000/api/notifications", {
          // Note: We will need to pass the JWT token here eventually!
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    fetchNotifications();
  }, []);

  // Calculate if we need the red dot
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative inline-block">
      {/* The Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-200 transition"
      >
        🔔{/* The Red Dot Indicator */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            Notifications
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-sm text-gray-500 text-center">
                No new notifications
              </li>
            ) : (
              notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`p-3 text-sm border-b border-gray-100 ${notif.is_read ? "text-gray-500" : "text-black font-medium bg-blue-50"}`}
                >
                  {notif.message}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
