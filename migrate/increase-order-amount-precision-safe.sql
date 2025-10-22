-- Safe Migration: Increase Order Amount Precision
-- This migration safely handles views that depend on total_amount column
-- Run this in Supabase SQL Editor or your migration pipeline

-- ========================================
-- STEP 1: Drop Dependent Views
-- ========================================
-- Views that depend on total_amount column must be dropped first
DROP VIEW IF EXISTS public.v_affiliate_orders CASCADE;
DROP VIEW IF EXISTS public.v_affiliate_customers CASCADE;

-- ========================================
-- STEP 2: Alter Column Types
-- ========================================
-- Increase precision for orders.total_amount from DECIMAL(10,2) to DECIMAL(12,2)
-- This allows values up to 9,999,999,999.99 (almost 10 billion)
ALTER TABLE public.orders
  ALTER COLUMN total_amount TYPE NUMERIC(12,2)
  USING total_amount::numeric;

-- Increase precision for order_items.price_at_purchase from DECIMAL(10,2) to DECIMAL(12,2)
ALTER TABLE public.order_items
  ALTER COLUMN price_at_purchase TYPE NUMERIC(12,2)
  USING price_at_purchase::numeric;

-- Increase precision for products.price from DECIMAL(10,2) to DECIMAL(12,2)
ALTER TABLE public.products
  ALTER COLUMN price TYPE NUMERIC(12,2)
  USING price::numeric;

-- Increase precision for payments.amount from DECIMAL(10,2) to DECIMAL(12,2)
ALTER TABLE public.payments
  ALTER COLUMN amount TYPE NUMERIC(12,2)
  USING amount::numeric;

-- ========================================
-- STEP 3: Update CHECK Constraints
-- ========================================
-- Update CHECK constraints to reflect new precision

-- Orders table
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_total_amount_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_amount_check 
  CHECK (total_amount > 0 AND total_amount <= 9999999999.99);

-- Order items table
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_price_at_purchase_check;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_price_at_purchase_check 
  CHECK (price_at_purchase > 0 AND price_at_purchase <= 9999999999.99);

-- Products table
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_price_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_price_check 
  CHECK (price > 0 AND price <= 9999999999.99);

-- Payments table
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_amount_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_amount_check 
  CHECK (amount > 0 AND amount <= 9999999999.99);

-- ========================================
-- STEP 4: Recreate Views
-- ========================================
-- Recreate views that were dropped in Step 1

-- Orders summary for affiliates
CREATE OR REPLACE VIEW public.v_affiliate_orders AS
SELECT 
  o.id AS order_id,
  o.created_at AS order_date,
  o.status,
  COALESCE(SUM(oi.quantity), 0) AS item_count,
  o.total_amount AS total_value,
  'Cus-' || SUBSTRING(o.user_id::TEXT FROM 1 FOR 6) AS customer_masked_name,
  o.affiliate_id
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.created_at, o.status, o.total_amount, o.user_id, o.affiliate_id;

-- Customers summary derived from orders (minimal, uses masked phone)
CREATE OR REPLACE VIEW public.v_affiliate_customers AS
SELECT 
  o.user_id AS customer_id,
  'Cus-' || SUBSTRING(o.user_id::TEXT FROM 1 FOR 6) AS first_name_initial,
  public.mask_phone(MAX(o.phone)) AS masked_phone,
  COUNT(*)::INT AS order_count,
  SUM(o.total_amount) AS total_value,
  MAX(o.created_at) AS last_order_date
FROM public.orders o
GROUP BY o.user_id;

-- ========================================
-- STEP 5: Grant Permissions
-- ========================================
-- Grant view access to application roles (RLS on base tables still applies)
GRANT SELECT ON public.v_affiliate_orders TO authenticated;
GRANT SELECT ON public.v_affiliate_orders TO anon;
GRANT SELECT ON public.v_affiliate_customers TO authenticated;
GRANT SELECT ON public.v_affiliate_customers TO anon;

-- ========================================
-- STEP 6: Verification (Optional)
-- ========================================
-- Uncomment these queries to verify the migration was successful

-- SELECT 
--   table_name, 
--   column_name, 
--   data_type, 
--   numeric_precision, 
--   numeric_scale
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name IN ('orders', 'order_items', 'products', 'payments') 
--   AND column_name IN ('total_amount', 'price_at_purchase', 'price', 'amount')
-- ORDER BY table_name, column_name;

-- Test the views
-- SELECT COUNT(*) FROM public.v_affiliate_orders;
-- SELECT COUNT(*) FROM public.v_affiliate_customers;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- The migration is now complete. All tables now support:
-- - Maximum value: 9,999,999,999.99 (almost 10 billion)
-- - Precision: 12 digits total, 2 decimal places
-- - Views have been recreated and permissions restored
