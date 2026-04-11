import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto flex max-w-md flex-col px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Create Account</h1>
          <p className="mb-6 text-sm text-gray-600">
            Sign up to start logging shows and building your watchlist.
          </p>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
              >
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
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <Link
              href="/login"
              className="block w-full rounded-full bg-black px-4 py-3 text-center text-white transition hover:bg-gray-800"
            >
              Sign Up
            </Link>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-black underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
