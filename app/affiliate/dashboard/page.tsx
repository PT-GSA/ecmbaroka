import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  name: string | null
  email: string | null
  status: 'active' | 'inactive'
  visibility_level: 'basic' | 'enhanced'
  created_at: string
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

  // Fetch customers derived from visible orders
  const { data: customersData } = await supabase
    .from('v_affiliate_customers')
    .select('*')
    .order('last_order_date', { ascending: false })

  const customers = (customersData ?? []) as unknown as AffiliateCustomer[]

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_value || 0), 0)
  const totalCustomers = customers.length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Affiliate</h1>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalCustomers}</div>
            <p className="text-sm text-gray-600 mt-1">Pelanggan yang Anda referensikan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalOrders}</div>
            <p className="text-sm text-gray-600 mt-1">Pesanan melalui link Anda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatCurrency(totalRevenue)}</div>
            <p className="text-sm text-gray-600 mt-1">Nilai pesanan (bruto)</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Customers */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pelanggan</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {customers.map((c) => (
          <Card key={c.customer_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{c.first_name_initial}</div>
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
          <div className="text-sm text-gray-600">Belum ada pelanggan yang direferensikan.</div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Orders */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pesanan</h2>
      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.order_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Order #{o.order_id.slice(0, 8)}</div>
                  <div className="text-sm text-gray-600">{o.customer_masked_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Item: {o.item_count}</div>
                  <div className="text-sm text-gray-600">Total: {formatCurrency(Number(o.total_value || 0))}</div>
                  <div className="text-xs text-gray-500">{formatDate(o.order_date)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-sm text-gray-600">Belum ada pesanan melalui link Anda.</div>
        )}
      </div>
    </div>
  )
}