export type TMDBImageSize = "w300" | "w500" | "w780" | "w1280" | "original";

export type Creator = {
  id?: number;
  name?: string;
  profile_path?: string | null;
};

export type Episode = {
  id?: number;
  name?: string | null;
  overview?: string | null;
  air_date?: string | null;
  episode_number?: number | null;
  season_number?: number | null;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number | null;
};

export type Season = {
  id?: number;
  name?: string;
  season_number?: number;
  episode_count?: number | null;
  air_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  vote_average?: number | null;
};
