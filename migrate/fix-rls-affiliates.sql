-- Fix recursive RLS policies on public.affiliates that cause
-- "infinite recursion detected in policy for relation 'affiliates'"
-- when evaluating SELECT policies in related tables (e.g., orders).

-- Ensure RLS is enabled (it should already be in your setup)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Replace self-referential SELECT policy with a non-recursive condition
DROP POLICY IF EXISTS "Affiliate can view own affiliate row" ON public.affiliates;
CREATE POLICY "Affiliate can view own affiliate row" ON public.affiliates
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Optional: allow affiliates to update their own row without recursion
DROP POLICY IF EXISTS "Affiliate can update own affiliate row" ON public.affiliates;
CREATE POLICY "Affiliate can update own affiliate row" ON public.affiliates
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Ensure admin policy is comprehensive and non-recursive
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
CREATE POLICY "Admins can manage affiliates" ON public.affiliates
  FOR ALL
  USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- Note: Run this file in Supabase SQL editor or psql connected to your database.
-- It safely replaces problematic policies and avoids table self-references
-- in USING/WITH CHECK expressions.