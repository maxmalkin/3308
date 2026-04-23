CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_alerts  BOOLEAN NOT NULL DEFAULT true,
  reply_alerts    BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_settings_select ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notification_settings_upsert ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_settings_update ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
