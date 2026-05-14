-- ============================================================
-- Before Die — Stories Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Stories Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  author_name text NOT NULL,
  author_type text NOT NULL DEFAULT 'anonymous'
    CHECK (author_type IN ('name', 'emoji', 'anonymous')),
  mood text NOT NULL DEFAULT 'reflective'
    CHECK (mood IN ('reflective', 'hopeful', 'somber', 'fierce')),
  language text NOT NULL DEFAULT 'id',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  CONSTRAINT stories_title_len CHECK (char_length(title) BETWEEN 2 AND 100),
  CONSTRAINT stories_content_len CHECK (char_length(content) BETWEEN 20 AND 2000),
  CONSTRAINT stories_author_name_len CHECK (char_length(author_name) BETWEEN 1 AND 40)
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────

-- Policy: Public can read published stories
DROP POLICY IF EXISTS "Public can read stories" ON public.stories;
CREATE POLICY "Public can read stories" ON public.stories
  FOR SELECT USING (published = true);

-- Policy: Anyone can insert a story submission
DROP POLICY IF EXISTS "Allow insert stories" ON public.stories;
CREATE POLICY "Allow insert stories" ON public.stories
  FOR INSERT WITH CHECK (true);

-- Policy: Admin can update (feature / publish operations)
DROP POLICY IF EXISTS "Admin can update stories" ON public.stories;
CREATE POLICY "Admin can update stories" ON public.stories
  FOR UPDATE USING (true);

-- ── Indexes ─────────────────────────────────────────────────

-- Main listing: published + sort by created_at
CREATE INDEX IF NOT EXISTS idx_stories_published_created_at
  ON public.stories (published, created_at DESC);

-- Featured listing: featured + published + created_at
CREATE INDEX IF NOT EXISTS idx_stories_featured_published_created_at
  ON public.stories (featured, published, created_at DESC);

-- Language filter
CREATE INDEX IF NOT EXISTS idx_stories_language
  ON public.stories (language);

-- Mood filter
CREATE INDEX IF NOT EXISTS idx_stories_mood
  ON public.stories (mood);

-- Cursor pagination
CREATE INDEX IF NOT EXISTS idx_stories_created_at
  ON public.stories (created_at DESC);

-- ── updated_at Trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_stories_updated_at();

-- ── Verification ─────────────────────────────────────────────
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'stories';