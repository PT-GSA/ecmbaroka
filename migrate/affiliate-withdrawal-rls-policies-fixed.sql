-- Fixed RLS Policies for Affiliate Withdrawals
-- Jalankan SETELAH schema utama berhasil dibuat

-- Drop existing basic policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.affiliate_bank_accounts;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.affiliate_bank_accounts;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.affiliate_bank_accounts;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.affiliate_commission_payments;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.affiliate_commission_payments;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.affiliate_commission_payments;

-- Create specific RLS policies
-- Affiliates can only see their own withdrawals
CREATE POLICY "Affiliates can view own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Affiliates can create withdrawal requests
CREATE POLICY "Affiliates can create withdrawals" ON public.affiliate_withdrawals
  FOR INSERT WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything (using correct user_profiles table structure)
CREATE POLICY "Admins can manage withdrawals" ON public.affiliate_withdrawals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bank accounts policies
CREATE POLICY "Affiliates can manage own bank accounts" ON public.affiliate_bank_accounts
  FOR ALL USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Commission payments policies
CREATE POLICY "Affiliates can view own commission payments" ON public.affiliate_commission_payments
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage commission payments" ON public.affiliate_commission_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
