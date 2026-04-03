CREATE TYPE public.watch_status AS ENUM ('Watched', 'In Progress', 'Want to Watch');

CREATE TABLE IF NOT EXISTS public.shows (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  original_name       TEXT,
  overview            TEXT,
  poster_path         TEXT,
  backdrop_path       TEXT,
  first_air_date      DATE,
  last_air_date       DATE,
  popularity          REAL,
  vote_average        REAL,
  vote_count          INTEGER,
  adult               BOOLEAN DEFAULT FALSE,
  original_language   TEXT,
  origin_country      TEXT[] DEFAULT '{}',
  genre_ids           INTEGER[] DEFAULT '{}',
  status              TEXT,
  type                TEXT,
  number_of_seasons   INTEGER,
  number_of_episodes  INTEGER,
  in_production       BOOLEAN,
  homepage            TEXT,
  tagline             TEXT,
  episode_run_time    INTEGER[] DEFAULT '{}',
  languages           TEXT[] DEFAULT '{}',
  genres              JSONB DEFAULT '[]',
  created_by          JSONB DEFAULT '[]',
  networks            JSONB DEFAULT '[]',
  production_companies JSONB DEFAULT '[]',
  production_countries JSONB DEFAULT '[]',
  seasons             JSONB DEFAULT '[]',
  spoken_languages    JSONB DEFAULT '[]',
  last_episode_to_air JSONB,
  next_episode_to_air JSONB,
  cached_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_shows (
  username   TEXT NOT NULL REFERENCES public."user"(username) ON DELETE CASCADE,
  show_id    INTEGER NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  status     public.watch_status NOT NULL DEFAULT 'Want to Watch',
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (username, show_id)
);

CREATE INDEX idx_user_shows_username ON public.user_shows (username);
CREATE INDEX idx_user_shows_show_id ON public.user_shows (show_id);
CREATE INDEX idx_user_shows_status ON public.user_shows (status);
CREATE INDEX idx_shows_popularity ON public.shows (popularity DESC);
CREATE INDEX idx_shows_name ON public.shows (name);

-- Migrate existing watchlist data (best-effort)
INSERT INTO public.user_shows (username, show_id, status)
SELECT w.username, s.id, 'Want to Watch'::public.watch_status
FROM public.watchlist w, LATERAL unnest(w.show_ids) AS sid
JOIN public.shows s ON s.id = sid::INTEGER
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS public.watchlist;
