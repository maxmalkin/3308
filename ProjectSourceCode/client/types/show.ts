export type WatchStatus = "Watched" | "In Progress" | "Want to Watch";

export type Genre = { id: number; name: string };

export type WatchProvider = {
  provider_name: string;
  provider_id?: number;
  logo_path?: string | null;
};

export type WatchProvidersUS = {
  flatrate?: WatchProvider[] | null;
  rent?: WatchProvider[] | null;
  buy?: WatchProvider[] | null;
  link?: string | null;
} | null;

export type Show = {
  id: number;
  name: string | null;
  original_name: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  popularity: number | null;
  vote_average: number | null;
  vote_count: number | null;
  adult: boolean | null;
  original_language: string | null;
  origin_country: string[] | null;
  genre_ids: number[] | null;
  status: string | null;
  type: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  in_production: boolean | null;
  homepage: string | null;
  tagline: string | null;
  episode_run_time: number[] | null;
  languages: string[] | null;
  genres: Genre[] | null;
  created_by: unknown[] | null;
  networks: Array<{ name: string; logo_path?: string | null }> | null;
  production_companies: unknown[] | null;
  production_countries: unknown[] | null;
  seasons: unknown[] | null;
  spoken_languages: unknown[] | null;
  last_episode_to_air: unknown | null;
  next_episode_to_air: unknown | null;
  watch_providers_us: WatchProvidersUS;
  distance?: number;
  added_at?: string;
  updated_at?: string;
};
