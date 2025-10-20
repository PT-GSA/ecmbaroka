-- Allow affiliates to view their own links and clicks (RLS policies)
-- Run this SQL in Supabase SQL Editor or your migration pipeline

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Replace existing admin-only policies with affiliate view access (without recursion)
DROP POLICY IF EXISTS "Affiliates can view their links" ON public.affiliate_links;
CREATE POLICY "Affiliates can view their links" ON public.affiliate_links
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.user_id = auth.uid() AND a.status = 'active' AND a.id = public.affiliate_links.affiliate_id
    )
  );

DROP POLICY IF EXISTS "Affiliates can view their clicks" ON public.affiliate_clicks;
CREATE POLICY "Affiliates can view their clicks" ON public.affiliate_clicks
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.user_id = auth.uid() AND a.status = 'active' AND a.id = public.affiliate_clicks.affiliate_id
    )
  );

-- Keep admin override comprehensive
DROP POLICY IF EXISTS "Admins can view all affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can view all affiliate links" ON public.affiliate_links
  FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()))
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Admins can view all affiliate clicks" ON public.affiliate_clicks
  FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()))
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin(auth.uid()));

-- Note: The tracking API uses the service role to upsert clicks, so INSERT policies for clicks are not required for end users.