-- Affiliate feature schema (Fase 1)
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Tables
-- ========================================

-- Affiliates master table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  visibility_level TEXT NOT NULL DEFAULT 'basic' CHECK (visibility_level IN ('basic','enhanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);

-- Affiliate campaign links
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  campaign TEXT,
  url_slug TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate click tracking
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  campaign TEXT,
  referrer TEXT,
  ua_hash TEXT,
  ip_hash TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer consent for affiliate contact
CREATE TABLE IF NOT EXISTS public.customer_consent (
  customer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_affiliate_contact BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission rules per campaign
CREATE TABLE IF NOT EXISTS public.affiliate_commission_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign TEXT,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0),
  active_from DATE,
  active_to DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'))
);

-- Audit events (basic)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_user_id UUID,
  actor_role TEXT,
  action TEXT,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Orders: add affiliate_id
-- ========================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON public.orders(affiliate_id);

-- ========================================
-- Functions: masking & role helpers
-- ========================================

-- Mask email like bu***@example.com
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  at_pos INT := POSITION('@' IN email);
  local_part TEXT;
  domain_part TEXT;
  masked_local TEXT;
BEGIN
  IF email IS NULL OR at_pos = 0 THEN
    RETURN NULL;
  END IF;
  local_part := LEFT(email, at_pos - 1);
  domain_part := SUBSTRING(email FROM at_pos);
  IF LENGTH(local_part) <= 2 THEN
    masked_local := SUBSTRING(local_part FROM 1 FOR 1) || repeat('*', GREATEST(LENGTH(local_part) - 1, 1));
  ELSE
    masked_local := SUBSTRING(local_part FROM 1 FOR 2) || repeat('*', LENGTH(local_part) - 2);
  END IF;
  RETURN masked_local || domain_part;
END;
$$;

-- Mask phone like 08***123 (first 2, last 3 visible)
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  len INT := COALESCE(LENGTH(phone), 0);
BEGIN
  IF phone IS NULL OR len = 0 THEN
    RETURN NULL;
  END IF;
  IF len <= 4 THEN
    RETURN repeat('*', len);
  END IF;
  RETURN SUBSTRING(phone FROM 1 FOR 2) || repeat('*', GREATEST(len - 5, 1)) || SUBSTRING(phone FROM len - 2 FOR 3);
END;
$$;

-- Check if current user is an active affiliate
CREATE OR REPLACE FUNCTION public.is_affiliate(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = uid AND a.status = 'active'
  );
$$;

-- Get affiliate id for a given user (if active)
CREATE OR REPLACE FUNCTION public.get_affiliate_id_for_uid(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.affiliates a
  WHERE a.user_id = uid AND a.status = 'active'
  LIMIT 1;
$$;

-- ========================================
-- Views (RLS enforced through base tables)
-- ========================================

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
GROUP BY o.id;

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
-- Row Level Security (RLS)
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Policies for affiliates table
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
CREATE POLICY "Admins can manage affiliates" ON public.affiliates
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Affiliate can view own affiliate row" ON public.affiliates;
CREATE POLICY "Affiliate can view own affiliate row" ON public.affiliates
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.affiliates a WHERE a.user_id = auth.uid() AND a.id = public.affiliates.id
    )
  );

-- Policies for orders: allow affiliates to view referred orders
DROP POLICY IF EXISTS "Affiliates can view their referred orders" ON public.orders;
CREATE POLICY "Affiliates can view their referred orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.user_id = auth.uid() AND a.status = 'active' AND a.id = public.orders.affiliate_id
    )
  );

-- Policies for order_items: allow view if parent order is visible to affiliate
DROP POLICY IF EXISTS "Affiliates can view items of referred orders" ON public.order_items;
CREATE POLICY "Affiliates can view items of referred orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = public.order_items.order_id AND EXISTS (
        SELECT 1 FROM public.affiliates a
        WHERE a.user_id = auth.uid() AND a.status = 'active' AND a.id = o.affiliate_id
      )
    )
  );

-- Admin override policies (reuse is_admin)
DROP POLICY IF EXISTS "Admins can view all affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Admins can view all affiliate clicks" ON public.affiliate_clicks
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can view all affiliate links" ON public.affiliate_links
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all customer consent" ON public.customer_consent;
CREATE POLICY "Admins can view all customer consent" ON public.customer_consent
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all commission rules" ON public.affiliate_commission_rules;
CREATE POLICY "Admins can view all commission rules" ON public.affiliate_commission_rules
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all audit events" ON public.audit_events;
CREATE POLICY "Admins can view all audit events" ON public.audit_events
  FOR ALL USING (public.is_admin(auth.uid()));

-- Note: Views rely on base table RLS; no policies are defined directly on views.

-- ========================================
-- End of affiliate schema
-- ========================================