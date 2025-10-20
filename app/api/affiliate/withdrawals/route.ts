import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate info
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, minimum_withdrawal')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!affiliate) {
      return NextResponse.json({ error: 'Not an active affiliate' }, { status: 403 })
    }

    const body = await req.json()
    const { amount, bank_name, account_number, account_holder_name } = body

    // Validate input
    if (!amount || !bank_name || !account_number || !account_holder_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const withdrawalAmount = Number(amount)
    const minimumWithdrawal = Number((affiliate as { minimum_withdrawal?: number }).minimum_withdrawal) || 50000

    if (withdrawalAmount < minimumWithdrawal) {
      return NextResponse.json({ 
        error: `Minimum withdrawal amount is Rp ${minimumWithdrawal.toLocaleString('id-ID')}` 
      }, { status: 400 })
    }

    // For now, return success - withdrawal creation will be implemented via SQL functions
    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal request functionality will be implemented via SQL functions' 
    })

  } catch (error) {
    console.error('Withdrawal API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate info
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!affiliate) {
      return NextResponse.json({ error: 'Not an active affiliate' }, { status: 403 })
    }

    // Get withdrawal history
    const affiliateId = (affiliate as { id: string }).id
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('affiliate_withdrawals')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })

    if (withdrawalsError) {
      console.error('Withdrawals fetch error:', withdrawalsError)
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }

    return NextResponse.json({ withdrawals: withdrawals || [] })

  } catch (error) {
    console.error('Withdrawal GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}