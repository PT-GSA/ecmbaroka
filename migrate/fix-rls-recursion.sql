-- Fix RLS infinite recursion by using SECURITY DEFINER function for admin checks
-- Run this in your Supabase SQL editor

-- Create helper function that checks if current user is admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = uid AND up.role = 'admin'
  );
$$;

-- Ensure ownership to a safe role (adjust if needed)
-- ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;

-- Update policies to use is_admin() instead of self-referencing subqueries

-- user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR ALL USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- products
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR ALL USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- order_items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR ALL USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR ALL USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- notifications
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- Note: If you have other tables with admin policies referencing user_profiles,
-- replicate the pattern above to avoid recursion.