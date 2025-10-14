import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Database } from '@/types/database'

type PaymentRowSlim = Pick<Database['public']['Tables']['payments']['Row'], 'amount' | 'status'>
type OrderRow = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status' | 'total_amount'>
type ProductRowSlim = Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name' | 'stock'>

async function ensureAdmin(): Promise<{ status: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 401, error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = (profile as Database['public']['Tables']['user_profiles']['Row'] | null)?.role
  if (role !== 'admin') return { status: 403, error: 'Forbidden' }
  return { status: 200 }
}

export async function GET(_req: NextRequest) {
  void _req
  const auth = await ensureAdmin()
  if (auth.status !== 200) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = createServiceClient()

  // Counts
  const totalOrdersRes = await service.from('orders').select('id', { count: 'exact', head: true })
  const totalOrders = totalOrdersRes.count ?? 0

  const pendingOrdersRes = await service.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  const pendingOrders = pendingOrdersRes.count ?? 0

  const completedOrdersRes = await service.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed')
  const completedOrders = completedOrdersRes.count ?? 0

  const productsRes = await service.from('products').select('id', { count: 'exact', head: true })
  const totalProducts = productsRes.count ?? 0

  const customersRes = await service.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer')
  const totalCustomers = customersRes.count ?? 0

  // Revenue
  const paymentsRes = await service.from('payments').select('amount, status').eq('status', 'verified')
  const payments = (paymentsRes.data ?? []) as PaymentRowSlim[]
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Recent orders
  const recentRes = await service
    .from('orders')
    .select('id, created_at, status, total_amount')
    .order('created_at', { ascending: false })
    .limit(3)
  const recentOrders = (recentRes.data ?? []) as OrderRow[]

  // Low stock products
  const lowStockRes = await service
    .from('products')
    .select('id, name, stock')
    .eq('is_active', true)
    .lte('stock', 10)
    .order('stock', { ascending: true })
    .limit(5)
  const lowStockProducts = (lowStockRes.data ?? []) as ProductRowSlim[]

  // Pending payments
  const pendingPaymentsRes = await service.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  const pendingPaymentsCount = pendingPaymentsRes.count ?? 0

  return NextResponse.json({
    stats: {
      totalOrders,
      totalProducts,
      totalCustomers,
      totalRevenue,
      pendingOrders,
      completedOrders,
    },
    recentOrders,
    lowStockProducts,
    pendingPaymentsCount,
  })
}