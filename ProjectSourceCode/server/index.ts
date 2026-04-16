import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth.ts";
import auth from "./routes/auth.ts";
import notificationsRouter from "./routes/notifications.ts";
import shows from "./routes/shows.ts";
import user from "./routes/user.ts";

const app = new Hono();

const corsOrigins = process.env.CORS_ORIGIN
  ? [process.env.CORS_ORIGIN]
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  "*",
  cors({
    origin: corsOrigins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/auth", auth);

app.use("/api/shows/search", authMiddleware);
app.use("/api/shows/recommendations", authMiddleware);
app.route("/api/shows", shows);

app.use("/api/notifications/*", authMiddleware);
app.route("/api/notifications", notificationsRouter);

app.use("/api/user/*", authMiddleware);
app.route("/api/user", user);

const port = Number(process.env.PORT) || 8000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
