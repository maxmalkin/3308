import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto flex max-w-md flex-col px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Login</h1>
          <p className="mb-6 text-sm text-gray-600">
            Sign in to access your logged shows and watchlist.
          </p>

          <form className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              className="w-full rounded-full bg-black px-4 py-3 text-white transition hover:bg-gray-800"
            >
              Log In
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link href="/register" className="font-medium text-black underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

