import sql from "../db.ts";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

function apiKey() {
  const key = process.env.GOOGLE;
  if (!key) throw new Error("GOOGLE env var is not set");
  return key;
}

const MAX_RPM = 90;
const MIN_INTERVAL_MS = Math.ceil(60_000 / MAX_RPM);
let nextAvailableAt = 0;

async function throttle() {
  const now = Date.now();
  const wait = nextAvailableAt - now;
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  nextAvailableAt = Math.max(now, nextAvailableAt) + MIN_INTERVAL_MS;
}

const QUERY_CACHE_MAX = 500;
const QUERY_CACHE_TTL_MS = 10 * 60 * 1000;
const queryCache = new Map<string, { values: number[]; ts: number }>();

function cacheKey(text: string): string {
  return text.trim().toLowerCase();
}

export async function embedText(text: string): Promise<number[]> {
  const key = cacheKey(text);
  const cached = queryCache.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < QUERY_CACHE_TTL_MS) {
    queryCache.delete(key);
    queryCache.set(key, cached);
    return cached.values;
  }
  await throttle();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey()}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: EMBED_DIM,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini embedding failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini embedding response missing values");
  }
  if (queryCache.size >= QUERY_CACHE_MAX) {
    const oldest = queryCache.keys().next().value;
    if (oldest !== undefined) queryCache.delete(oldest);
  }
  queryCache.set(key, { values, ts: now });
  return values;
}

export function toPgVector(values: number[]): string {
  return `[${values.join(",")}]`;
}

type ShowLike = {
  name?: string | null;
  original_name?: string | null;
  overview?: string | null;
  tagline?: string | null;
  genres?: Array<{ name?: string }> | unknown;
};

export function buildShowEmbeddingText(show: ShowLike): string {
  const genreNames = Array.isArray(show.genres)
    ? (show.genres as Array<{ name?: string }>)
        .map((g) => g?.name)
        .filter(Boolean)
        .join(", ")
    : "";
  return [
    show.name ?? "",
    show.original_name && show.original_name !== show.name
      ? show.original_name
      : "",
    show.tagline ?? "",
    genreNames ? `Genres: ${genreNames}` : "",
    show.overview ?? "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function embedAndStoreShow(showId: number, show: ShowLike) {
  const text = buildShowEmbeddingText(show);
  if (!text) return;
  const values = await embedText(text);
  const vec = toPgVector(values);
  await sql`
    UPDATE public.shows
    SET embedding = ${vec}::vector
    WHERE id = ${showId}
  `;
}
