export default function ErrorBanner({ message }: { message?: string | null }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm">{message ?? "Please try again later."}</p>
    </div>
  );
}
