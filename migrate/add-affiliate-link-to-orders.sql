-- Add affiliate_link_id to orders and ensure unique click tracking
-- Run this in Supabase SQL editor or your migration pipeline

-- Add affiliate_link_id to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL;

-- Index for faster lookups by affiliate_link_id
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_link_id ON public.orders(affiliate_link_id);

-- Ensure unique clicks per affiliate by UA/IP hash (prevents duplicate spam)
-- Note: If you prefer a time-bucket uniqueness (e.g., per day), replace with a partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_clicks_by_hash
  ON public.affiliate_clicks(affiliate_id, ua_hash, ip_hash);