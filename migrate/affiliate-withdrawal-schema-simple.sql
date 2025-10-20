-- Affiliate Withdrawal System Schema (Simplified Version)
-- Jalankan di Supabase SQL Editor

-- 1. Affiliate withdrawal requests table
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  request_notes TEXT, -- Notes from affiliate
  admin_notes TEXT, -- Notes from admin
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who processed
  processed_at TIMESTAMPTZ NULL,
  transfer_reference TEXT, -- Bank transfer reference number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Affiliate bank accounts table (for storing affiliate bank details)
CREATE TABLE IF NOT EXISTS public.affiliate_bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Affiliate commission payments table (tracking paid commissions)
CREATE TABLE IF NOT EXISTS public.affiliate_commission_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  withdrawal_id UUID REFERENCES public.affiliate_withdrawals(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON public.affiliate_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_created_at ON public.affiliate_withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_bank_accounts_affiliate_id ON public.affiliate_bank_accounts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commission_payments_affiliate_id ON public.affiliate_commission_payments(affiliate_id);

-- 5. Add minimum withdrawal amount to affiliates table
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS minimum_withdrawal NUMERIC(12,2) NOT NULL DEFAULT 50000; -- Default Rp 50,000

-- 6. Add total_paid_commission to affiliates table
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS total_paid_commission NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 7. Create views for easier querying
CREATE OR REPLACE VIEW public.v_affiliate_withdrawal_summary AS
SELECT 
  aw.id,
  aw.affiliate_id,
  a.code as affiliate_code,
  a.name as affiliate_name,
  aw.amount,
  aw.status,
  aw.bank_name,
  aw.account_number,
  aw.account_holder_name,
  aw.request_notes,
  aw.admin_notes,
  aw.processed_by,
  aw.processed_at,
  aw.transfer_reference,
  aw.created_at,
  aw.updated_at
FROM public.affiliate_withdrawals aw
JOIN public.affiliates a ON a.id = aw.affiliate_id;

-- 8. Create function to calculate available commission
CREATE OR REPLACE FUNCTION public.get_available_commission(affiliate_uuid UUID)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_commission NUMERIC(12,2) := 0;
  paid_commission NUMERIC(12,2) := 0;
  available_commission NUMERIC(12,2) := 0;
BEGIN
  -- Calculate total commission from orders
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO total_commission
  FROM public.orders
  WHERE affiliate_id = affiliate_uuid
    AND commission_calculated_at IS NOT NULL
    AND status IN ('verified', 'processing', 'shipped', 'completed');

  -- Calculate already paid commission
  SELECT COALESCE(SUM(amount), 0)
  INTO paid_commission
  FROM public.affiliate_withdrawals
  WHERE affiliate_id = affiliate_uuid
    AND status IN ('approved', 'processing', 'completed');

  -- Calculate available commission
  available_commission := total_commission - paid_commission;
  
  RETURN GREATEST(available_commission, 0);
END;
$$;

-- 9. Grant permissions
GRANT SELECT ON public.v_affiliate_withdrawal_summary TO authenticated;
GRANT SELECT ON public.v_affiliate_withdrawal_summary TO anon;

-- 10. Enable RLS (but don't create policies yet)
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commission_payments ENABLE ROW LEVEL SECURITY;

-- 11. Create basic RLS policies (simplified)
-- Allow all authenticated users to read (will be restricted by application logic)
CREATE POLICY "Allow authenticated read" ON public.affiliate_withdrawals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read" ON public.affiliate_bank_accounts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read" ON public.affiliate_commission_payments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert (will be restricted by application logic)
CREATE POLICY "Allow authenticated insert" ON public.affiliate_withdrawals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON public.affiliate_bank_accounts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON public.affiliate_commission_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update (will be restricted by application logic)
CREATE POLICY "Allow authenticated update" ON public.affiliate_withdrawals
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON public.affiliate_bank_accounts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON public.affiliate_commission_payments
  FOR UPDATE USING (auth.role() = 'authenticated');
