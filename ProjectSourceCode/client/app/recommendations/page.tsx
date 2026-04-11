import Navbar from "../../components/Navbar";

const recommendedShows = [
  {
    id: 1,
    title: "Abbott Elementary",
    genre: "Comedy",
    platforms: ["Hulu"],
  },
  {
    id: 2,
    title: "Breaking Bad",
    genre: "Crime Drama",
    platforms: ["Netflix"],
  },
  {
    id: 3,
    title: "Severance",
    genre: "Thriller",
    platforms: ["Apple TV+"],
  },
];

export default function RecommendationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Recommended for You</h1>
        <p className="mb-8 text-sm text-gray-600">
          Suggested shows based on your interests and saved platforms.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedShows.map((show) => (
            <div key={show.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">{show.title}</h2>
              <p className="mb-2 text-sm text-gray-700">
                <span className="font-medium">Genre:</span> {show.genre}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Available on:</span>{" "}
                {show.platforms.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
