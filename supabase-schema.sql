CREATE TABLE IF NOT EXISTS public.dreams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  dream text NOT NULL,
  reason text NOT NULL,
  language text NOT NULL DEFAULT 'id',
  status text NOT NULL DEFAULT 'published',
  ip_hash text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dreams_name_len CHECK (char_length(name) BETWEEN 2 AND 40),
  CONSTRAINT dreams_dream_len CHECK (char_length(dream) BETWEEN 10 AND 140),
  CONSTRAINT dreams_reason_len CHECK (char_length(reason) BETWEEN 20 AND 500)
);

ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published" ON public.dreams;
CREATE POLICY "Public can read published" ON public.dreams
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Allow insert" ON public.dreams;
CREATE POLICY "Allow insert" ON public.dreams
  FOR INSERT WITH CHECK (true);
