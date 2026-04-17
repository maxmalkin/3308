import Link from "next/link";

export default function LoginPrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <Link
        href="/login"
        className="mt-4 inline-block rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Log in
      </Link>
    </div>
  );
}
