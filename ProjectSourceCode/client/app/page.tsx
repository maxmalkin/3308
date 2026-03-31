
import Navbar from "../components/Navbar";
import ShowCard from "../components/ShowCard";
import { shows } from "../data/shows";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold">Log your shows</h1>

  <button className="bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800">
    + Add Show
  </button>
</div>

        <div className="flex gap-4 overflow-x-auto">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </div>
    </main>
  );
}

