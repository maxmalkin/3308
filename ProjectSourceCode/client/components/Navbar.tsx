import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b px-6 py-4 bg-white">
      <div className="flex justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold">
          PillarBoxd
        </Link>

        <div className="flex gap-6 text-sm">
          <Link href="/watchlist">Watchlist</Link>
          <a href="#recommendations">Recommendations</a>
          <button className="border px-3 py-1 rounded-full">
            Account
          </button>
        </div>
      </div>
    </nav>
  );
}
