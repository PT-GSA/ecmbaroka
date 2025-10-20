import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import AffiliateLayout from '@/components/affiliate/layout'

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  name: string | null
  email: string | null
  status: 'active' | 'inactive'
  visibility_level: 'basic' | 'enhanced'
  created_at: string
  commission_rate: number
  minimum_withdrawal?: number
}

type AffiliateOrder = {
  order_id: string
  order_date: string
  status: string
  item_count: number
  total_value: number
  customer_masked_name: string
  affiliate_id: string | null
}

type AffiliateCustomer = {
  customer_id: string
  first_name_initial: string
  masked_phone: string | null
  order_count: number
  total_value: number
  last_order_date: string
}


type AffiliateClickRow = {
  campaign: string | null
  clicked_at: string
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/affiliate/login')
  }

  // Ensure user is an active affiliate
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (affiliateError) {
    // If error due to RLS, treat as not affiliate
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Affiliate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Terjadi kesalahan saat memuat data affiliate.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!affiliate) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Affiliate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Akun Anda belum terdaftar sebagai affiliate. Silakan hubungi admin.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const aff = affiliate as unknown as AffiliateRow

  // Fetch orders referred to this affiliate (RLS ensures restriction)
  const { data: ordersData } = await supabase
    .from('v_affiliate_orders')
    .select('*')
    .eq('affiliate_id', aff.id)
    .order('order_date', { ascending: false })

  const orders = (ordersData ?? []) as unknown as AffiliateOrder[]

  // Fetch commission details from orders table (direct, via RLS policy)
  type OrderCommissionRow = {
    id: string
    user_id: string
    phone: string | null
    commission_rate: number
    commission_amount: number
    commission_calculated_at: string | null
    total_amount: number
    status: 'pending' | 'paid' | 'verified' | 'processing' | 'shipped' | 'completed' | 'cancelled'
    created_at: string
    affiliate_link_id: string | null
  }

  const { data: commissionData } = await supabase
    .from('orders')
    .select('id, user_id, phone, commission_rate, commission_amount, commission_calculated_at, total_amount, status, created_at, affiliate_link_id')
    .eq('affiliate_id', aff.id)

  const commissionRows = (commissionData ?? []) as unknown as OrderCommissionRow[]
  const commissionByOrderId = new Map(commissionRows.map((r) => [r.id, r]))
  // Fallback kalkulasi komisi di sisi UI jika kolom komisi tidak bisa dibaca karena RLS
  const eligibleOrders = orders.filter((o) => ['paid', 'verified', 'completed'].includes(o.status))
  const missingOrders = eligibleOrders.filter((o) => {
    const r = commissionByOrderId.get(o.order_id)
    return !r || !r.commission_calculated_at
  })

  let commissionFallbackByOrderId = new Map<string, number>()
  if (missingOrders.length > 0) {
    const missingIds = missingOrders.map((o) => o.order_id)
    const { data: itemRows } = await supabase
      .from('order_items')
      .select('order_id, quantity')
      .in('order_id', missingIds)
    const cartonsByOrderId = new Map<string, number>()
    ;(itemRows ?? []).forEach((it: { order_id: string; quantity: number }) => {
      const prev = cartonsByOrderId.get(it.order_id) ?? 0
      cartonsByOrderId.set(it.order_id, prev + Number(it.quantity || 0))
    })
    const perCarton = (() => {
      const r = Number(aff.commission_rate ?? 0)
      if (!Number.isFinite(r) || r <= 0) return 10800
      return r
    })()
    commissionFallbackByOrderId = new Map<string, number>(
      missingOrders.map((o) => {
        const cartons = cartonsByOrderId.get(o.order_id) ?? 0
        const amount = Math.round(perCarton * cartons * 100) / 100
        return [o.order_id, amount]
      })
    )
  }

  const totalCommissionDirect = commissionRows.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0)
  const totalCommissionFallback = Array.from(commissionFallbackByOrderId.values()).reduce((s, v) => s + Number(v || 0), 0)
  const totalCommission = totalCommissionDirect + totalCommissionFallback
  

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_value || 0), 0)

  // Get clicks data for conversion rate
  const { data: clicksData } = await service
    .from('affiliate_clicks')
    .select('campaign, clicked_at')
    .eq('affiliate_id', aff.id)

  const clicks: AffiliateClickRow[] = (clicksData ?? []) as AffiliateClickRow[]
  const totalClicks = clicks.length
  const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0

  // Derive customers strictly from affiliate's orders, and gate visibility until there are transactions

  // Tampilkan pelanggan hanya jika sudah ada transaksi (paid/verified/completed)
  const shouldShowCustomers = eligibleOrders.length > 0
  let customers: AffiliateCustomer[] = []
  if (shouldShowCustomers) {
    const byCust = new Map<string, { count: number; sum: number; last: string }>()
    eligibleOrders.forEach((o) => {
      const key = o.customer_masked_name
      const prev = byCust.get(key) ?? { count: 0, sum: 0, last: '1970-01-01T00:00:00Z' }
      const created = String(o.order_date)
      const last = prev.last && created > prev.last ? created : prev.last
      byCust.set(key, {
        count: prev.count + 1,
        sum: prev.sum + Number(o.total_value || 0),
        last,
      })
    })
    customers = Array.from(byCust.entries()).map(([mask, agg]) => ({
      customer_id: mask,
      first_name_initial: mask,
      masked_phone: null,
      order_count: agg.count,
      total_value: agg.sum,
      last_order_date: agg.last,
    }))
    customers.sort((a, b) => (a.last_order_date < b.last_order_date ? 1 : a.last_order_date > b.last_order_date ? -1 : 0))
  }

  const totalCustomers = customers.length

  // Formatting helpers for neat numbers in cards
  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(Number(n || 0))
  const formatPct1 = (n: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(n || 0))
  // Deprecated percent formatter; commission uses nominal per carton now


  return (
    <AffiliateLayout affiliate={{
      id: aff.id,
      name: aff.name || '',
      code: aff.code,
      email: aff.email || ''
    }}>
      <div className="space-y-6">
        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-6 lg:p-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard Affiliate</h1>
              <p className="text-base opacity-90">Selamat datang, {aff.name ?? aff.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-1h-2a3 3 0 0 1 0-6h2V8h2v1h2a3 3 0 0 1 0 6h-2Zm-4-5a1 1 0 0 0 0 2h2v-2Zm6 0h-2v2h2a1 1 0 0 0 0-2Z"/>
              </svg>
              <span className="text-base">Total Komisi <span className="tabular-nums">{formatCurrency(totalCommission)}</span></span>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatNumber(totalCustomers)}</div>
              <p className="text-sm text-gray-600 mt-1">Pelanggan yang Anda referensikan</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatNumber(totalOrders)}</div>
              <p className="text-sm text-gray-600 mt-1">Pesanan melalui link Anda</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(totalRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">Nilai pesanan (bruto)</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatPct1(conversionRate)}%</div>
              <p className="text-sm text-gray-600 mt-1">Orders / Clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Order #{o.order_id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">{o.customer_masked_name} • {o.item_count} item</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(Number(o.total_value || 0))}</div>
                      <div className="text-sm text-gray-500">{formatDate(o.order_date)}</div>
                    </div>
                  </div>
                ))}
                {orders.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">Dan {orders.length - 5} pesanan lainnya...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada aktivitas pesanan</p>
                <p className="text-sm">Mulai dengan membuat link referral di menu &quot;Links & Campaigns&quot;</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a 
                href="/affiliate/links" 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <div className="text-lg font-medium text-gray-900 mb-1">Kelola Links</div>
                <div className="text-sm text-gray-600">Buat dan kelola link referral</div>
              </a>
              <a 
                href="/affiliate/withdrawals" 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <div className="text-lg font-medium text-gray-900 mb-1">Request Pencairan</div>
                <div className="text-sm text-gray-600">Cairkan komisi Anda</div>
              </a>
              <a 
                href="/affiliate/analytics" 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <div className="text-lg font-medium text-gray-900 mb-1">Lihat Analytics</div>
                <div className="text-sm text-gray-600">Analisis performa campaign</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AffiliateLayout>
  )
}