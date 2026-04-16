"use client";

import { useEffect, useState } from "react";

type Settings = {
  episode_alerts: boolean;
  reply_alerts: boolean;
};

export default function NotificationSettings() {
  const [settings, setSettings] = useState<Settings>({
    episode_alerts: true,
    reply_alerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 2. Handle toggling a switch
  const handleToggle = async (key: keyof Settings) => {
    // Optimistically update the UI so it feels instant to the user
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        // If the server fails, revert the toggle back to its original state
        setSettings(settings);
        console.error("Failed to save setting");
      }
    } catch (error) {
      setSettings(settings);
      console.error("Error saving setting", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-500">
          Manage how Pillarboxd alerts you about your shows and reviews.
        </p>
      </div>

      <div className="space-y-6">
        {/* Toggle 1: Episode Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Daily Episode Alerts</h3>
            <p className="text-xs text-gray-500">Get notified when a tracked show airs a new episode.</p>
          </div>
          <button
            onClick={() => handleToggle("episode_alerts")}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.episode_alerts ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.episode_alerts ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Reply Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Review Replies</h3>
            <p className="text-xs text-gray-500">Get notified when someone replies to your review.</p>
          </div>
          <button
            onClick={() => handleToggle("reply_alerts")}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.reply_alerts ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.reply_alerts ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}