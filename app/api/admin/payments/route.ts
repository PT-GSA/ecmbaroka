import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Database } from '@/types/database'

type PaymentRow = Pick<Database['public']['Tables']['payments']['Row'], 'id' | 'order_id' | 'bank_name' | 'amount' | 'status' | 'created_at'>
type OrderLite = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'user_id'>
type UserLite = Pick<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'full_name'>

async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 401, error: 'Unauthorized' as const }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = (profile as Database['public']['Tables']['user_profiles']['Row'] | null)?.role
  if (role !== 'admin') return { status: 403, error: 'Forbidden' as const }
  return { status: 200 as const }
}

export async function GET(_req: NextRequest) {
  void _req
  const auth = await ensureAdmin()
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()

  // Fetch payments
  const paymentsRes = await service
    .from('payments')
    .select('id, order_id, bank_name, amount, status, created_at')
    .order('created_at', { ascending: false })
  const payments = (paymentsRes.data ?? []) as PaymentRow[]

  // Join orders to get user_id
  const orderIds = Array.from(new Set(payments.map(p => p.order_id).filter(Boolean)))
  let ordersMap: Record<string, { user_id: string }> = {}
  if (orderIds.length > 0) {
    const ordersRes = await service
      .from('orders')
      .select('id, user_id')
      .in('id', orderIds)
    const orders = (ordersRes.data ?? []) as OrderLite[]
    ordersMap = orders.reduce((acc, o) => {
      acc[o.id] = { user_id: o.user_id }
      return acc
    }, {} as Record<string, { user_id: string }>)
  }

  // Join user profiles to get full_name
  const userIds = Array.from(new Set(Object.values(ordersMap).map(o => o.user_id).filter(Boolean)))
  let usersMap: Record<string, { full_name: string }> = {}
  if (userIds.length > 0) {
    const usersRes = await service
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds)
    const users = (usersRes.data ?? []) as UserLite[]
    usersMap = users.reduce((acc, u) => {
      acc[u.id] = { full_name: u.full_name ?? 'Customer' }
      return acc
    }, {} as Record<string, { full_name: string }>)
  }

  const items = payments.map(p => ({
    id: p.id,
    order_id: p.order_id,
    customer_name: usersMap[ordersMap[p.order_id]?.user_id ?? '']?.full_name ?? 'Customer',
    amount: Number(p.amount),
    method: p.bank_name || 'Bank Transfer',
    status: p.status,
    created_at: p.created_at,
  }))

  return NextResponse.json({ payments: items })
}