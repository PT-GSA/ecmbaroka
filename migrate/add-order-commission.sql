-- Add commission tracking columns to orders
-- commission_rate: percentage from affiliate profile (0-100)
-- commission_amount: computed monetary value at time of payment verification
-- commission_calculated_at: timestamp when commission was computed

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_calculated_at TIMESTAMPTZ NULL;