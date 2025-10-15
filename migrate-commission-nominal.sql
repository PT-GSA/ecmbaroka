-- Upgrade commission columns to support nominal per-carton values
-- Run this in Supabase SQL Editor or your migration pipeline

-- Ensure columns exist before altering types
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(12,2) NOT NULL DEFAULT 10800;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_calculated_at TIMESTAMPTZ NULL;

-- Increase precision for affiliates.commission_rate (now stores Rupiah per carton)
ALTER TABLE public.affiliates
  ALTER COLUMN commission_rate TYPE NUMERIC(12,2)
  USING commission_rate::numeric;

-- Increase precision for orders.commission_rate (stores nominal per carton used at calculation time)
ALTER TABLE public.orders
  ALTER COLUMN commission_rate TYPE NUMERIC(12,2)
  USING commission_rate::numeric;

-- Optional: set default nominal for affiliates that have small percentage-like values
-- Uncomment if you want to normalize existing affiliates to Rp 10,800 per carton
-- UPDATE public.affiliates
-- SET commission_rate = 10800
-- WHERE commission_rate <= 100;

-- Verification queries (optional)
-- SELECT column_name, data_type, numeric_precision, numeric_scale
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name IN ('affiliates','orders') AND column_name = 'commission_rate';