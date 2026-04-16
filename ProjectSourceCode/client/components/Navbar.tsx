import Link from "next/link";
import { createSupabaseServerClient } from '@/supabase/server-client';
import UserDropdown from "./UserDropdown";

export default async function Navbar() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          PillarBoxd
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/recommendations">Recommendations</Link>
          
          {user ? (
            <UserDropdown email={user.email} />
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}