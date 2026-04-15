import sql from "../db.ts";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

function apiKey() {
  const key = process.env.GOOGLE;
  if (!key) throw new Error("GOOGLE env var is not set");
  return key;
}

export async function embedText(text: string): Promise<number[]> {
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
