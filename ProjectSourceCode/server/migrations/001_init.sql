CREATE TABLE IF NOT EXISTS public."user" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  owned_services TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.watchlist (
  username TEXT PRIMARY KEY REFERENCES public."user"(username) ON DELETE CASCADE,
  show_ids TEXT[] DEFAULT '{}'
);
