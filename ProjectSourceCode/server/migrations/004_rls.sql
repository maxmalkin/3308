ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_select ON public."user"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_update ON public."user"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY user_shows_select ON public.user_shows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_shows_insert ON public.user_shows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_shows_update ON public.user_shows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_shows_delete ON public.user_shows
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY shows_select ON public.shows
  FOR SELECT USING (auth.role() = 'authenticated');
