import sql from "../db.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";

function headers() {
  return { Authorization: `Bearer ${process.env.TVDB_READ_TOKEN}` };
}

export async function searchTMDB(query: string, page: number) {
  const url = new URL(`${TMDB_BASE}/search/tv`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`TMDB returned ${res.status}`);
  return res.json();
}

export async function fetchWatchProviders(showId: number) {
  const res = await fetch(`${TMDB_BASE}/tv/${showId}/watch/providers`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.US ?? null;
}

export async function fetchAndCacheShow(showId: number) {
  const [cached] = await sql`
		SELECT * FROM public.shows
		WHERE id = ${showId}
		AND cached_at > NOW() - INTERVAL '24 hours'
	`;
  if (cached) return cached;

  const res = await fetch(`${TMDB_BASE}/tv/${showId}`, {
    headers: headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TMDB returned ${res.status}`);

  const data = await res.json();
  const watchProvidersUS = await fetchWatchProviders(showId);

  const originCountry: string[] = Array.isArray(data.origin_country)
    ? data.origin_country
    : data.origin_country
      ? [data.origin_country]
      : [];
  const genreIds: number[] = (data.genres || []).map(
    (g: { id: number }) => g.id,
  );
  const runTimes: number[] = data.episode_run_time || [];
  const langs: string[] = data.languages || [];

  const [row] = await sql`
		INSERT INTO public.shows (
			id, name, original_name, overview, poster_path, backdrop_path,
			first_air_date, last_air_date, popularity, vote_average, vote_count,
			adult, original_language, origin_country, genre_ids, status, type,
			number_of_seasons, number_of_episodes, in_production, homepage, tagline,
			episode_run_time, languages, genres, created_by, networks,
			production_companies, production_countries, seasons, spoken_languages,
			last_episode_to_air, next_episode_to_air, watch_providers_us, cached_at, updated_at
		) VALUES (
			${data.id},
			${data.name},
			${data.original_name},
			${data.overview},
			${data.poster_path},
			${data.backdrop_path},
			${data.first_air_date || null},
			${data.last_air_date || null},
			${data.popularity},
			${data.vote_average},
			${data.vote_count},
			${data.adult},
			${data.original_language},
			${originCountry}::text[],
			${genreIds}::integer[],
			${data.status},
			${data.type},
			${data.number_of_seasons},
			${data.number_of_episodes},
			${data.in_production},
			${data.homepage},
			${data.tagline},
			${runTimes}::integer[],
			${langs}::text[],
			${sql.json(data.genres || [])},
			${sql.json(data.created_by || [])},
			${sql.json(data.networks || [])},
			${sql.json(data.production_companies || [])},
			${sql.json(data.production_countries || [])},
			${sql.json(data.seasons || [])},
			${sql.json(data.spoken_languages || [])},
			${data.last_episode_to_air ? sql.json(data.last_episode_to_air) : null},
			${data.next_episode_to_air ? sql.json(data.next_episode_to_air) : null},
			${watchProvidersUS ? sql.json(watchProvidersUS) : null},
			NOW(),
			NOW()
		)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			overview = EXCLUDED.overview,
			poster_path = EXCLUDED.poster_path,
			backdrop_path = EXCLUDED.backdrop_path,
			popularity = EXCLUDED.popularity,
			vote_average = EXCLUDED.vote_average,
			vote_count = EXCLUDED.vote_count,
			number_of_seasons = EXCLUDED.number_of_seasons,
			number_of_episodes = EXCLUDED.number_of_episodes,
			status = EXCLUDED.status,
			seasons = EXCLUDED.seasons,
			last_episode_to_air = EXCLUDED.last_episode_to_air,
			next_episode_to_air = EXCLUDED.next_episode_to_air,
			in_production = EXCLUDED.in_production,
			watch_providers_us = EXCLUDED.watch_providers_us,
			cached_at = NOW(),
			updated_at = NOW()
		RETURNING *
	`;
  return row;
}
