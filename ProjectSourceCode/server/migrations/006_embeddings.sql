CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_shows_embedding
  ON public.shows USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
