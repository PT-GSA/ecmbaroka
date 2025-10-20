import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function ensureAdmin(): Promise<{ ok: true } | { ok: false; redirect: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, redirect: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
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

    // For now, return success - actual update will be handled by SQL functions
    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal update functionality will be implemented via SQL functions' 
    })

  } catch (error) {
    console.error('Admin withdrawal update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}