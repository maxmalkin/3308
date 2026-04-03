ALTER TABLE public."user" ADD COLUMN email TEXT UNIQUE;

ALTER TABLE public.user_shows ADD COLUMN user_id UUID;

UPDATE public.user_shows us
SET user_id = u.id
FROM public."user" u
WHERE u.username = us.username;

ALTER TABLE public.user_shows ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_shows DROP CONSTRAINT user_shows_pkey;
ALTER TABLE public.user_shows DROP CONSTRAINT user_shows_username_fkey;

ALTER TABLE public.user_shows ADD PRIMARY KEY (user_id, show_id);
ALTER TABLE public.user_shows ADD CONSTRAINT user_shows_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE public.user_shows DROP COLUMN username;

DROP INDEX IF EXISTS idx_user_shows_username;
CREATE INDEX idx_user_shows_user_id ON public.user_shows (user_id);
