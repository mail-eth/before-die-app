-- ============================================================
-- Before Die — Resonates (reactions) Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add resonates column to dreams table
ALTER TABLE public.dreams
  ADD COLUMN IF NOT EXISTS resonates integer NOT NULL DEFAULT 0;

-- Create a separate table to track unique resonates per IP hash
-- This prevents one person from spamming resonates
CREATE TABLE IF NOT EXISTS public.dream_resonates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dream_id uuid NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_resonate_per_ip UNIQUE (dream_id, ip_hash)
);

ALTER TABLE public.dream_resonates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read resonates
DROP POLICY IF EXISTS "Public can read resonates" ON public.dream_resonates;
CREATE POLICY "Public can read resonates" ON public.dream_resonates
  FOR SELECT USING (true);

-- Policy: Anyone can insert resonates
DROP POLICY IF EXISTS "Allow insert resonates" ON public.dream_resonates;
CREATE POLICY "Allow insert resonates" ON public.dream_resonates
  FOR INSERT WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_dream_resonates_dream_id
  ON public.dream_resonates (dream_id);

-- Function to increment resonates count atomically
CREATE OR REPLACE FUNCTION increment_resonate(dream_uuid uuid, visitor_hash text)
RETURNS boolean AS $$
DECLARE
  inserted boolean;
BEGIN
  INSERT INTO public.dream_resonates (dream_id, ip_hash)
  VALUES (dream_uuid, visitor_hash)
  ON CONFLICT (dream_id, ip_hash) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted THEN
    UPDATE public.dreams
    SET resonates = resonates + 1
    WHERE id = dream_uuid;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;
