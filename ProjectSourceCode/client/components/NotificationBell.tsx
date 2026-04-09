"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // We moved this out of useEffect so the Load More button can call it too
  const fetchNotifications = async (pageToFetch: number) => {
    try {
      // Notice the new ?page= URL parameters!
      const res = await fetch(`http://localhost:8000/api/notifications?page=${pageToFetch}&limit=5`, {
        headers: { "Content-Type": "application/json" },
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // If it's page 1, replace the list. Otherwise, stick the new alerts to the bottom.
        if (pageToFetch === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        
        // Check if there are more pages left in the database
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  // Fetch Page 1 when the bell first loads
  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative inline-block">
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
              <li className="p-4 text-sm text-gray-500 text-center">No new notifications</li>
            ) : (
              <>
                {notifications.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`p-3 text-sm border-b border-gray-100 ${notif.is_read ? "text-gray-500" : "text-black font-medium bg-blue-50"}`}
                  >
                    {notif.message}
                  </li>
                ))}
                
                {/* The new Load More Button */}
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