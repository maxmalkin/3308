import { serve } from "@hono/node-server";
import { Hono } from "hono";
import register from "./routes/register.js";
import shows from "./routes/shows.js";
import userShows from "./routes/userShows.js";

const app = new Hono();

app.route("/api/register", register);
app.route("/api/shows", shows);
app.route("/api/users/:username/shows", userShows);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
