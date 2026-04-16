import Link from "next/link";
import Navbar from "../../components/Navbar";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) 
{
  const params = await searchParams;
  
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto flex max-w-md flex-col px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Login</h1>
          <p className="mb-6 text-sm text-gray-600">
            Sign in to access your logged shows and watchlist.
          </p>

            {params?.error && (
              <div className="text-sm font-medium text-red-600">
                Invalid email or password
              </div>
            )}

          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              formAction={login}
              className="w-full rounded-full bg-black px-4 py-3 text-white transition hover:bg-gray-800"
            >
              Log In
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-black underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}