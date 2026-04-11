import Navbar from "../../components/Navbar";

const watchlistItems = [
  {
    id: 1,
    title: "The Bear",
    added: true,
    platforms: ["Hulu"],
  },
  {
    id: 2,
    title: "Stranger Things",
    added: true,
    platforms: ["Netflix"],
  },
  {
    id: 3,
    title: "Severance",
    added: true,
    platforms: ["Apple TV+"],
  },
];

export default function WatchlistPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Your Queue</h1>
        <p className="mb-8 text-sm text-gray-600">
          Shows that are up next on your list
        </p>

        <div className="space-y-4">
          {watchlistItems.map((show) => (
            <div key={show.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold">{show.title}</h2>
                <span className="rounded-full border px-3 py-1 text-sm">
                  {show.added ? ( //make button to add/unadd
                    <p>Added</p>
                  ) : (
                    <p>Not Added</p>
                  )}
                </span>
              </div>

              <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
                <p>
                  <span className="font-medium">Platforms:</span>{" "}
                  {show.platforms.join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
