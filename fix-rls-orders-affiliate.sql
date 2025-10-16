-- Fix RLS policy so affiliates can only view their referred orders
-- and can read commission fields reliably from orders table.

-- Enable RLS on orders if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Replace incorrect/overly-permissive policy with proper affiliate scoping
DROP POLICY IF EXISTS "Affiliates can view their referred orders" ON public.orders;
CREATE POLICY "Affiliates can view their referred orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.user_id = auth.uid() AND a.status = 'active' AND a.id = public.orders.affiliate_id
    )
  );

-- Optional: allow admins to view all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));