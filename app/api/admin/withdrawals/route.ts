import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

async function ensureAdmin(): Promise<{ ok: true } | { ok: false; redirect: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, redirect: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile as { role: string }).role !== 'admin') {
    return { ok: false, redirect: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { ok: true }
}

export async function GET(req: NextRequest) {
  const adminCheck = await ensureAdmin()
  if (!adminCheck.ok) return adminCheck.redirect

  try {
    const service = createServiceClient()
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = service
      .from('v_affiliate_withdrawal_summary')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: withdrawals, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }

    // Get total count - simple approach
    let countQuery = service
      .from('v_affiliate_withdrawal_summary')
      .select('*', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      withdrawals: withdrawals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin withdrawals GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const adminCheck = await ensureAdmin()
  if (!adminCheck.ok) return adminCheck.redirect

  try {
    const body = await req.json()
    const { withdrawal_id, status } = body

    if (!withdrawal_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['pending', 'approved', 'processing', 'completed', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get admin user info
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createServiceClient()
    
    // Update withdrawal status using direct SQL query
    const updateData: Database['public']['Tables']['affiliate_withdrawals']['Update'] = {
      status: body.status as Database['public']['Tables']['affiliate_withdrawals']['Row']['status'],
      admin_notes: body.admin_notes || null,
      transfer_reference: body.transfer_reference || null,
      processed_by: user.id,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error: updateError } = await service
      .from('affiliate_withdrawals')
      // @ts-expect-error - Supabase client type issue with custom tables
      .update(updateData)
      .eq('id', withdrawal_id)

    if (updateError) {
      console.error('Withdrawal update error:', updateError)
      return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
    }

    // If status is completed, update affiliate's total_paid_commission
    if (body.status === 'completed') {
      // Get withdrawal data to update commission
      const { data: withdrawalData } = await service
        .from('affiliate_withdrawals')
        .select('affiliate_id, amount')
        .eq('id', withdrawal_id)
        .single()

      if (withdrawalData) {
        const withdrawal = withdrawalData as { affiliate_id: string; amount: number }
        
        // Get current total_paid_commission
        const { data: affiliateData } = await service
          .from('affiliates')
          .select('total_paid_commission')
          .eq('id', withdrawal.affiliate_id)
          .single()

        if (affiliateData) {
          const affiliate = affiliateData as { total_paid_commission: number }
          const newTotal = Number(affiliate.total_paid_commission) + Number(withdrawal.amount)
          
          await service
            .from('affiliates')
            // @ts-expect-error - Supabase client type issue with custom tables
            .update({ total_paid_commission: newTotal })
            .eq('id', withdrawal.affiliate_id)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal updated successfully' 
    })

  } catch (error) {
    console.error('Admin withdrawal update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}