// temporary placeholder, just wanted to have to be able to click to screen
// similar layout to queue but hold different information
import Image from "next/image";
import Navbar from "../../components/Navbar";

const logItems = [
  {
    id: 1,
    title: "The Bear",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eget nisl eu felis volutpat efficitur. Morbi pulvinar feugiat euismod. Mauris consequat erat nulla, ",
    platforms: ["Hulu"],
  },
  {
    id: 2,
    title: "Stranger Things",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eget nisl eu felis volutpat efficitur. ",
    platforms: ["Netflix"],
  },
  {
    id: 3,
    title: "Severance",
    description: "Lorem ipsum dolor sit amet",
    platforms: ["Apple TV+"],
  },
];

export default function LogPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Your Log</h1>
        <p className="mb-8 text-sm text-gray-600">
          Shows that you've watched
        </p>

        <div className="space-y-4">
                  {logItems.map((show) => (
                    <div key={show.id} className="rounded-2xl bg-white p-6 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        {/* temp image for the queue -> translates to most other pages */}
                        

                        <div className="show-image">
                                          <Image src={`https://placehold.co/80x120?text=${encodeURIComponent(show.title)}`} alt={show.title} width={80}
                                          height={120}
                                          className="rounded"
                                        />
                        </div>
                        <h2 className="text-xl font-semibold">{show.title}</h2>
                        <p>
                          <span className="font-medium">Platforms:</span>{" "}
                          {show.platforms.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">Description:</span>{" "}
                          {show.description}
                        </p>
                      </div>
        
                    </div>
                  ))}
                </div>
      </div>
    </main>
  );
}
