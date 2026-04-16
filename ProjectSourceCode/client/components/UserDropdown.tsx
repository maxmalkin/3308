'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from '@/supabase/browser-client';

export default function UserDropdown({ email }: { email?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refresh the page to update the Navbar state
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-gray-50 transition"
      >
        <span className="font-medium">Account</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Invisible backdrop to close dropdown when clicking outside */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white py-2 shadow-lg z-20">
            <div className="px-4 py-2 text-xs text-gray-500 border-b mb-1">
              {email}
            </div>
            <Link 
              href="/settings" 
              className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Account Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}