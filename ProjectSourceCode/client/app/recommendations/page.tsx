// import Image from "next/image";
import Navbar from "../../components/Navbar";

const _recommendedShows = [
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
    </main>
  );
}
