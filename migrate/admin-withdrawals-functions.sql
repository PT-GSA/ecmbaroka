-- SQL Functions for Affiliate Withdrawals System
-- Jalankan di Supabase SQL Editor

-- 1. Function to get withdrawal count
CREATE OR REPLACE FUNCTION public.get_withdrawal_count(status_filter TEXT DEFAULT 'all')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  IF status_filter = 'all' THEN
    SELECT COUNT(*) INTO count_result FROM public.affiliate_withdrawals;
  ELSE
    SELECT COUNT(*) INTO count_result FROM public.affiliate_withdrawals WHERE status = status_filter;
  END IF;
  
  RETURN count_result;
END;
$$;

-- 2. Function to update withdrawal
CREATE OR REPLACE FUNCTION public.update_withdrawal(
  withdrawal_id UUID,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL,
  transfer_reference TEXT DEFAULT NULL,
  processed_by UUID DEFAULT NULL,
  processed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_withdrawals
  SET 
    status = new_status,
    admin_notes = admin_notes,
    transfer_reference = transfer_reference,
    processed_by = processed_by,
    processed_at = processed_at,
    updated_at = NOW()
  WHERE id = withdrawal_id;

  -- If status is completed, update affiliate's total_paid_commission
  IF new_status = 'completed' THEN
    UPDATE public.affiliates
    SET total_paid_commission = total_paid_commission + (
      SELECT amount FROM public.affiliate_withdrawals WHERE id = withdrawal_id
    )
    WHERE id = (
      SELECT affiliate_id FROM public.affiliate_withdrawals WHERE id = withdrawal_id
    );
  END IF;
END;
$$;

-- 3. Function to create withdrawal request
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  affiliate_id UUID,
  amount NUMERIC,
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  request_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.affiliate_withdrawals (
    affiliate_id,
    amount,
    bank_name,
    account_number,
    account_holder_name,
    request_notes,
    status
  ) VALUES (
    affiliate_id,
    amount,
    bank_name,
    account_number,
    account_holder_name,
    request_notes,
    'pending'
  );
END;
$$;

-- 4. Function to get affiliate withdrawals
CREATE OR REPLACE FUNCTION public.get_affiliate_withdrawals(affiliate_id UUID)
RETURNS TABLE (
  id UUID,
  amount NUMERIC,
  status TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  request_notes TEXT,
  admin_notes TEXT,
  transfer_reference TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aw.id,
    aw.amount,
    aw.status,
    aw.bank_name,
    aw.account_number,
    aw.account_holder_name,
    aw.request_notes,
    aw.admin_notes,
    aw.transfer_reference,
    aw.created_at,
    aw.updated_at,
    aw.processed_at
  FROM public.affiliate_withdrawals aw
  WHERE aw.affiliate_id = get_affiliate_withdrawals.affiliate_id
  ORDER BY aw.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_withdrawal_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_withdrawal(UUID, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request(UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_withdrawals(UUID) TO authenticated;
