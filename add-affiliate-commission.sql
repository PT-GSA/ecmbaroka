-- Add commission field to affiliates
-- Run this in Supabase SQL editor or your migration pipeline

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Notes:
-- - commission_rate is percentage (e.g., 10.5 means 10.5%)
-- - Default 0 indicates no commission configured yet
-- - Existing RLS policy "Admins can manage affiliates" already allows admin updates