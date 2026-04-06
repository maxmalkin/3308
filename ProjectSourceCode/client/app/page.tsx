import Link from "next/link";
import Navbar from "../components/Navbar";

// const activity = [ //Temporary data for activity dashboard
//   {
//     id: 1,
//     user: "melody",
//     action: "started watching",
//     show: "The Bear",
//     time: "2 hours ago",
//   },
//   {
//     id: 2,
//     user: "melody",
//     action: "finished",
//     show: "Severance",
//     time: "yesterday",
//   },
//   {
//     id: 3,
//     user: "melody",
//     action: "added to watchlist",
//     show: "Breaking Bad",
//     time: "3 days ago",
//   },
// ];

export default function Home() { //this page should be the pre-log-in page
  return (
    <main className="min-h-screen bg-[#f5f1ea] text-neutral-900">
      <Navbar />

    




      {/* <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
            Dashboard
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            Your recent activity
          </h1>
        </div> */}

        {/* <div className="space-y-6">
          {activity.map((item) => (
            <article
              key={item.id}
              className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm"
            >
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
                {item.time}
              </p>

              <h2 className="text-2xl font-medium leading-snug">
                <span className="font-semibold">{item.user}</span>{" "}
                {item.action}{" "}
                <span className="italic">{item.show}</span>
              </h2>
            </article>
          ))}
        </div> */}
      {/* </div> */}
    </main>
  );
}

