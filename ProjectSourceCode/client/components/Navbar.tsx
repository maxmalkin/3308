import Link from "next/link"; //general Navbar file -> Make it look different based on logged in versus not

export default function Navbar() {
  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl justify-between">
        <Link href="/" className="text-xl font-bold">
          PillarBoxd
        </Link>

        <div className="flex gap-6 text-sm">
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/recommendations">Recommendations</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      </div>
    </nav>
  );
}

//when logged out -> only login + register
