import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import CopyInput from '@/components/ui/copy-input'

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

type AffiliateLinkRow = {
  id: string
  campaign: string | null
  url_slug: string
  active: boolean
}

type AffiliateClickRow = {
  campaign: string | null
  clicked_at: string
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
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
    commission_rate: number
    commission_amount: number
    commission_calculated_at: string | null
    total_amount: number
    status: 'pending' | 'paid' | 'verified' | 'processing' | 'shipped' | 'completed' | 'cancelled'
    created_at: string
  }

  const { data: commissionData } = await supabase
    .from('orders')
    .select('id, commission_rate, commission_amount, commission_calculated_at, total_amount, status, created_at, affiliate_link_id')
    .eq('affiliate_id', aff.id)

  const commissionRows = (commissionData ?? []) as unknown as (OrderCommissionRow & { affiliate_link_id: string | null })[]
  const commissionByOrderId = new Map(commissionRows.map((r) => [r.id, r]))
  const totalCommission = commissionRows.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0)
  const pendingCommissionCount = commissionRows.filter((r) => !r.commission_calculated_at && ['paid', 'verified', 'processing', 'shipped', 'completed'].includes(r.status)).length
  const lastCommissionCalc = commissionRows
    .map((r) => r.commission_calculated_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1) || null

  // Fetch customers derived from visible orders
  const { data: customersData } = await supabase
    .from('v_affiliate_customers')
    .select('*')
    .order('last_order_date', { ascending: false })

  const customers = (customersData ?? []) as unknown as AffiliateCustomer[]

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_value || 0), 0)
  const totalCustomers = customers.length

  // Campaign performance data
  const { data: linksData } = await supabase
    .from('affiliate_links')
    .select('id, campaign, url_slug, active')
    .eq('affiliate_id', aff.id)

  const { data: clicksData } = await supabase
    .from('affiliate_clicks')
    .select('campaign, clicked_at')
    .eq('affiliate_id', aff.id)

  const links: AffiliateLinkRow[] = (linksData ?? []) as AffiliateLinkRow[]
  const clicks: AffiliateClickRow[] = (clicksData ?? []) as AffiliateClickRow[]

  const totalClicks = clicks.length
  const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0

  // Formatting helpers for neat numbers in cards
  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(Number(n || 0))
  const formatPct1 = (n: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(n || 0))
  // Deprecated percent formatter; commission uses nominal per carton now

  const clicksByCampaign = new Map<string, number>()
  clicks.forEach((c) => {
    const key = (c.campaign ?? '').trim()
    clicksByCampaign.set(key, (clicksByCampaign.get(key) ?? 0) + 1)
  })

  // Orders per link (from orders.affiliate_link_id)
  const ordersByLinkId = new Map<string, number>()
  commissionRows.forEach((r) => {
    const lid = (r.affiliate_link_id ?? '').trim()
    if (!lid) return
    ordersByLinkId.set(lid, (ordersByLinkId.get(lid) ?? 0) + 1)
  })

  const campaignRows: { url_slug: string; campaign: string; active: boolean; clicks: number; orders: number; convPct: number }[] = links.map((l) => {
    const key = (l.campaign ?? '').trim()
    const clicksCount = clicksByCampaign.get(key) ?? 0
    const ordersCount = ordersByLinkId.get(l.id) ?? 0
    const convPct = clicksCount > 0 ? (ordersCount / clicksCount) * 100 : 0
    return {
      url_slug: l.url_slug,
      campaign: l.campaign ?? '-',
      active: l.active,
      clicks: clicksCount,
      orders: ordersCount,
      convPct,
    }
  })

  // Status badge styles for orders
  const statusBadgeClass: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    verified: 'bg-emerald-100 text-emerald-800',
    processing: 'bg-orange-100 text-orange-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-rose-100 text-rose-800',
  }

  const maxClicks = Math.max(0, ...campaignRows.map((r) => r.clicks))

  // Build app origin for full tracking links
  const hdrs = await headers()
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000'
  const origin = `${proto}://${host}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Affiliate</h1>
            <p className="text-sm sm:text-base/6 opacity-90">Selamat datang, {aff.name ?? aff.code}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-1h-2a3 3 0 0 1 0-6h2V8h2v1h2a3 3 0 0 1 0 6h-2Zm-4-5a1 1 0 0 0 0 2h2v-2Zm6 0h-2v2h2a1 1 0 0 0 0-2Z"/>
              </svg>
              <span className="text-sm sm:text-base">Total Komisi <span className="tabular-nums">{formatCurrency(totalCommission)}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatNumber(totalCustomers)}</div>
            <p className="text-sm text-gray-600 mt-1">Pelanggan yang Anda referensikan</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatNumber(totalOrders)}</div>
            <p className="text-sm text-gray-600 mt-1">Pesanan melalui link Anda</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatCurrency(totalRevenue)}</div>
            <p className="text-sm text-gray-600 mt-1">Nilai pesanan (bruto)</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Total Komisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatCurrency(totalCommission)}</div>
            <p className="text-sm text-gray-600 mt-1">Akumulasi komisi dari pesanan</p>
            <div className="text-xs text-gray-500 mt-2">Komisi per karton saat ini: <span className="tabular-nums">{formatCurrency(Number(aff.commission_rate || 0))}</span></div>
            {lastCommissionCalc && (
              <div className="text-xs text-gray-500">Terakhir dihitung: {formatDate(lastCommissionCalc)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Komisi Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatNumber(pendingCommissionCount)}</div>
            <p className="text-sm text-gray-600 mt-1">Pesanan dibayar/terverifikasi belum dihitung komisinya</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Total Klik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatNumber(totalClicks)}</div>
            <p className="text-sm text-gray-600 mt-1">Klik pada link campaign Anda</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-semibold tracking-tight tabular-nums">{formatPct1(conversionRate)}%</div>
            <p className="text-sm text-gray-600 mt-1">Orders / Clicks</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Customers */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pelanggan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {customers.map((c) => (
          <Card key={c.customer_id} className="group shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-gray-950">{c.first_name_initial}</div>
                  <div className="text-sm text-gray-600">{c.masked_phone ?? '-'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Orders: {c.order_count}</div>
                  <div className="text-sm text-gray-600">Total: {formatCurrency(Number(c.total_value || 0))}</div>
                  <div className="text-xs text-gray-500">Terakhir: {formatDate(c.last_order_date)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">Belum ada pelanggan yang direferensikan.</div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Orders */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pesanan</h2>
      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.order_id} className="group shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900 group-hover:text-gray-950">Order #{o.order_id.slice(0, 8)}</div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                  </div>
                  <div className="text-sm text-gray-600">{o.customer_masked_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Item: {o.item_count}</div>
                  <div className="text-sm text-gray-600">Total: {formatCurrency(Number(o.total_value || 0))}</div>
                  {commissionByOrderId.has(o.order_id) && (
                    <div className="text-sm text-gray-600">
                      Komisi: {formatCurrency(Number(commissionByOrderId.get(o.order_id)!.commission_amount || 0))} ({formatCurrency(Number(commissionByOrderId.get(o.order_id)!.commission_rate || 0))}/karton)
                    </div>
                  )}
                  <div className="text-xs text-gray-500">{formatDate(o.order_date)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">Belum ada pesanan melalui link Anda.</div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Campaign Performance */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Kinerja Campaign</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-700">
              <th className="py-2 pr-4">Link</th>
              <th className="py-2 pr-4">Campaign</th>
              <th className="py-2 pr-4">Klik</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Konversi</th>
              <th className="py-2 pr-4">Tracking Link</th>
            </tr>
          </thead>
          <tbody>
            {campaignRows.map((r) => (
              <tr key={`${r.url_slug}-${r.campaign}`} className="border-t border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-900">{r.url_slug}</td>
                <td className="py-2 pr-4 text-gray-700">{r.campaign}</td>
                <td className="py-2 pr-4 text-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="relative w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-indigo-600" style={{ width: maxClicks ? `${Math.round((r.clicks / maxClicks) * 100)}%` : '0%' }} />
                    </div>
                    <span className="tabular-nums">{r.clicks}</span>
                  </div>
                </td>
                <td className="py-2 pr-4">
                  <span className={r.active ? 'text-green-600' : 'text-gray-500'}>
                    {r.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-700">
                  {r.clicks > 0 ? (
                    <span>{r.orders} / {r.clicks} ({r.convPct.toFixed(1)}%)</span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-700">
                  <CopyInput
                    value={`${appUrl}/api/affiliate/track?slug=${encodeURIComponent(r.url_slug)}`}
                    label="Copy link tracking"
                    className="max-w-[420px]"
                  />
                </td>
              </tr>
            ))}
            {campaignRows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-2 pr-4 text-gray-600">
                  Belum ada link/campaign untuk akun Anda. Minta admin membuat link kampanye
                  di halaman Admin &gt; Kelola Affiliates. Setelah dibuat, Anda bisa membagikan
                  link tracking (contoh: /api/affiliate/track?slug=SLUG) atau langsung menambahkan
                  parameter slug ke URL tujuan (contoh: /products?slug=SLUG); sistem akan otomatis
                  mencatat klik.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}