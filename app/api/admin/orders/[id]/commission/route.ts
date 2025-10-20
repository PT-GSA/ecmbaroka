import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

async function ensureAdmin(req: NextRequest): Promise<{ ok: true } | { ok: false; redirect: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, redirect: NextResponse.redirect(new URL('/admin-auth/login', req.url)) }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
  if (!typedProfile || typedProfile.role !== 'admin') {
    return { ok: false, redirect: NextResponse.redirect(new URL('/', req.url)) }
  }
  return { ok: true }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await ensureAdmin(req)
  if (!admin.ok) return admin.redirect

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch order essentials
  const { data: orderRow, error: orderErr } = await service
    .from('orders')
    .select('id, status, total_amount, affiliate_id, commission_calculated_at')
    .eq('id', id)
    .maybeSingle()

  if (orderErr || !orderRow) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  type OrderLite = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'status' | 'total_amount' | 'affiliate_id' | 'commission_calculated_at'>
  const order = orderRow as OrderLite

  // Only attribute commission when order is paid, verified, or completed
  if (!['paid', 'verified', 'completed'].includes(order.status)) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'status_not_eligible' })
  }

  // Avoid double calculation
  if (order.commission_calculated_at) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already_calculated' })
  }

  // Resolve commission rate
  // Resolve commission per carton (fixed nominal, in Rupiah)
  let commissionPerCarton = 0
  if (order.affiliate_id) {
    const { data: affRow } = await service
      .from('affiliates')
      .select('commission_rate')
      .eq('id', order.affiliate_id)
      .maybeSingle()
    const aff = affRow as Pick<Database['public']['Tables']['affiliates']['Row'], 'commission_rate'> | null
    commissionPerCarton = Number(aff?.commission_rate ?? 0)
    if (!Number.isFinite(commissionPerCarton) || commissionPerCarton < 0) commissionPerCarton = 0
    // Default global commission if not set: 10,800 per carton
    if (commissionPerCarton === 0) commissionPerCarton = 10800
  }

  // Compute total cartons from order_items
  const { data: items } = await service
    .from('order_items')
    .select('quantity')
    .eq('order_id', order.id)
  const totalCartons = (items ?? []).reduce((sum: number, it: { quantity: number }) => sum + Number(it.quantity || 0), 0)

  // Compute commission amount (rounded to 2 decimals)
  const rawAmount = commissionPerCarton * totalCartons
  const commissionAmount = Math.round(rawAmount * 100) / 100

  // Persist commission attribution (ensure proper TS typing for update payload)
  const payload: Database['public']['Tables']['orders']['Update'] = {
    // Store per-carton nominal in commission_rate field for now
    commission_rate: commissionPerCarton,
    commission_amount: commissionAmount,
    commission_calculated_at: new Date().toISOString(),
  }

  const updateBuilder = service.from('orders') as unknown as {
    update: (
      values: Database['public']['Tables']['orders']['Update']
    ) => { eq: (column: string, value: string) => Promise<{ error: unknown }> }
  }

  const { error: updErr } = await updateBuilder.update(payload).eq('id', order.id)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, commission_rate: commissionPerCarton, commission_amount: commissionAmount, total_cartons: totalCartons })
}