'use client'

import { useState, useEffect, type KeyboardEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  ShoppingCart,
  Target,
  ArrowUpRight,
  Filter,
  Minimize2
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
const ReportsExportButton = dynamic(() => import('@/components/pdf/ReportsExportButton'), { ssr: false })

interface SalesData {
  date: string
  revenue: number
  orders: number
  customers: number
}

interface ProductData {
  id: string
  name: string
  sales: number
  revenue: number
  quantity: number
}

interface CustomerData {
  id: string
  name: string
  orders: number
  totalSpent: number
  lastOrder: string
  segment: 'new' | 'regular' | 'vip'
}

interface FinancialData {
  month: string
  revenue: number
  costs: number
  profit: number
  profitMargin: number
}

type PaymentRowSlim = Pick<Database['public']['Tables']['payments']['Row'], 'amount' | 'status' | 'transfer_date'>

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'sales' | 'customers' | 'financial'>('sales')
  const [periodFilter, setPeriodFilter] = useState('30')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [compact, setCompact] = useState(false)

  // Accessible tab navigation support
  const tabs: Array<'sales' | 'customers' | 'financial'> = ['sales', 'customers', 'financial']
  const handleTabKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    current: 'sales' | 'customers' | 'financial'
  ) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const index = tabs.indexOf(current)
      const nextIndex = e.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length
      const next = tabs[nextIndex]
      setActiveTab(next)
      const nextBtn = document.getElementById(`tabbtn-${next}`)
      nextBtn?.focus()
    }
  }

  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [customerData, setCustomerData] = useState<CustomerData[]>([])
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [monthlyCustomers, setMonthlyCustomers] = useState<{ month: string, count: number }[]>([])
  const [paymentDistribution, setPaymentDistribution] = useState<{ label: string, percent: number }[]>([])

  const supabase = createSupabaseClient()

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        // Determine range
        let startDate: Date
        let endDate: Date
        if (dateRange.start && dateRange.end) {
          startDate = new Date(dateRange.start)
          endDate = new Date(dateRange.end)
        } else {
          endDate = new Date()
          const days = parseInt(periodFilter)
          startDate = new Date()
          startDate.setDate(endDate.getDate() - (isNaN(days) ? 30 : days) + 1)
        }

        const startISO = startDate.toISOString()
        const endISO = endDate.toISOString()

        type OrderRow = Database['public']['Tables']['orders']['Row']
        type PaymentRow = Database['public']['Tables']['payments']['Row']
        type OrderItemRow = Database['public']['Tables']['order_items']['Row']
        type ProductRow = Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name'>
        type UserProfileRow = Pick<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'full_name' | 'created_at'>

        // Fetch core datasets in parallel
        const [ordersRes, paymentsRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .gte('created_at', startISO)
            .lte('created_at', endISO),
          supabase
            .from('payments')
            .select('*')
            .eq('status', 'verified')
            .gte('transfer_date', startISO)
            .lte('transfer_date', endISO)
        ])

        if (ordersRes.error) throw new Error(ordersRes.error.message)
        if (paymentsRes.error) throw new Error(paymentsRes.error.message)

        const orders = (ordersRes.data ?? []) as OrderRow[]
        const payments = (paymentsRes.data ?? []) as PaymentRow[]

        // SalesData per day
        const daysSpan: string[] = []
        const cursor = new Date(startDate)
        while (cursor <= endDate) {
          daysSpan.push(new Date(cursor).toISOString().slice(0, 10))
          cursor.setDate(cursor.getDate() + 1)
        }
        const dailySales: SalesData[] = daysSpan.map((d) => {
          const revenue = payments
            .filter(p => p.transfer_date.slice(0,10) === d)
            .reduce((sum, p) => sum + Number(p.amount), 0)
          const dayOrders = orders.filter(o => o.created_at.slice(0,10) === d)
          const customersCount = new Set(dayOrders.map(o => o.user_id)).size
          return { date: d, revenue, orders: dayOrders.length, customers: customersCount }
        })
        setSalesData(dailySales)

        // Top products from order_items
        const orderIds = orders.map(o => o.id)
        let items: OrderItemRow[] = []
        if (orderIds.length > 0) {
          const itemsRes = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds)
          if (itemsRes.error) throw new Error(itemsRes.error.message)
          items = (itemsRes.data ?? []) as OrderItemRow[]
        }
        const productIds = Array.from(new Set(items.map(i => i.product_id)))
        const productsMap = new Map<string, string>()
        if (productIds.length > 0) {
          const productsRes = await supabase
            .from('products')
            .select('id,name')
            .in('id', productIds)
          if (productsRes.error) throw new Error(productsRes.error.message)
          const products = (productsRes.data ?? []) as ProductRow[]
          products.forEach(p => productsMap.set(p.id, p.name))
        }
        const productAgg = new Map<string, { quantity: number, revenue: number, orderSet: Set<string> }>()
        items.forEach(i => {
          const key = i.product_id
          const prev = productAgg.get(key) ?? { quantity: 0, revenue: 0, orderSet: new Set<string>() }
          prev.quantity += i.quantity
          prev.revenue += i.quantity * Number(i.price_at_purchase)
          prev.orderSet.add(i.order_id)
          productAgg.set(key, prev)
        })
        const topProducts: ProductData[] = Array.from(productAgg.entries())
          .map(([pid, agg]) => ({
            id: pid,
            name: productsMap.get(pid) ?? pid,
            sales: agg.orderSet.size,
            revenue: agg.revenue,
            quantity: agg.quantity,
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
        setProductData(topProducts)

        // Top customers
        const byUser = new Map<string, { orders: OrderRow[], payments: PaymentRow[] }>()
        orders.forEach(o => {
          const bucket = byUser.get(o.user_id) ?? { orders: [], payments: [] }
          bucket.orders.push(o)
          byUser.set(o.user_id, bucket)
        })
        payments.forEach(p => {
          // map payment to user via order_id
          const order = orders.find(o => o.id === p.order_id)
          if (!order) return
          const bucket = byUser.get(order.user_id) ?? { orders: [], payments: [] }
          bucket.payments.push(p)
          byUser.set(order.user_id, bucket)
        })
        const userIds = Array.from(byUser.keys())
        const namesMap = new Map<string, { name: string, created_at: string }>()
        if (userIds.length > 0) {
          const profilesRes = await supabase
            .from('user_profiles')
            .select('id, full_name, created_at')
            .in('id', userIds)
          if (profilesRes.error) throw new Error(profilesRes.error.message)
          const profiles = (profilesRes.data ?? []) as UserProfileRow[]
          profiles.forEach(p => namesMap.set(p.id, { name: p.full_name, created_at: p.created_at }))
        }
        const customersComputed: CustomerData[] = Array.from(byUser.entries()).map(([uid, data]) => {
          const name = namesMap.get(uid)?.name ?? uid
          const ordersCount = data.orders.length
          const totalSpent = data.payments.reduce((sum, p) => sum + Number(p.amount), 0)
          const lastOrder = data.orders.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? ''
          const segment: CustomerData['segment'] = ordersCount > 10 ? 'vip' : ordersCount > 3 ? 'regular' : 'new'
          return { id: uid, name, orders: ordersCount, totalSpent, lastOrder: lastOrder.slice(0,10), segment }
        })
        setCustomerData(customersComputed.sort((a, b) => b.totalSpent - a.totalSpent))

        // Financial monthly (last 6 months)
        const now = new Date()
        const months: { key: string, label: string, start: Date, end: Date }[] = []
        for (let i = 5; i >= 0; i--) {
          const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const startM = new Date(m)
          const endM = new Date(m.getFullYear(), m.getMonth() + 1, 0)
          const label = m.toLocaleString('id-ID', { month: 'short' }) + ' ' + m.getFullYear()
          months.push({ key: m.toISOString().slice(0,7), label, start: startM, end: endM })
        }
        const monthLabels = months.map(m => m.label)
        const monthlyRevenue: number[] = []
        for (const m of months) {
          const { data, error } = await supabase
            .from('payments')
            .select('amount, status, transfer_date')
            .eq('status', 'verified')
            .gte('transfer_date', m.start.toISOString())
            .lte('transfer_date', new Date(m.end.getFullYear(), m.end.getMonth(), m.end.getDate(), 23, 59, 59).toISOString())
          if (error) throw new Error(error.message)
          const rows = (data ?? []) as PaymentRowSlim[]
          const sum = rows.reduce((s, p) => s + Number(p.amount), 0)
          monthlyRevenue.push(sum)
        }
        const financial: FinancialData[] = monthLabels.map((label, idx) => {
          const revenue = monthlyRevenue[idx]
          const costs = 0
          const profit = revenue - costs
          const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
          return { month: label, revenue, costs, profit, profitMargin }
        })
        setFinancialData(financial)

        // Monthly new customers (last 7 months)
        const months7: { label: string, start: Date, end: Date }[] = []
        for (let i = 6; i >= 0; i--) {
          const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const startM = new Date(m)
          const endM = new Date(m.getFullYear(), m.getMonth() + 1, 0)
          const label = m.toLocaleString('id-ID', { month: 'short' })
          months7.push({ label, start: startM, end: endM })
        }
        const monthlyCounts: { month: string, count: number }[] = []
        for (const m of months7) {
          const { count, error } = await supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', m.start.toISOString())
            .lte('created_at', new Date(m.end.getFullYear(), m.end.getMonth(), m.end.getDate(), 23, 59, 59).toISOString())
          if (error) throw new Error(error.message)
          monthlyCounts.push({ month: m.label, count: count ?? 0 })
        }
        setMonthlyCustomers(monthlyCounts)

        // Payment distribution by bank_name (verified payments)
        const totalPayments = payments.length
        const byBank = new Map<string, number>()
        payments.forEach(p => {
          const key = (p.bank_name || 'Bank Transfer')
          byBank.set(key, (byBank.get(key) ?? 0) + 1)
        })
        const distribution = Array.from(byBank.entries()).map(([label, cnt]) => ({
          label,
          percent: totalPayments > 0 ? Math.round((cnt / totalPayments) * 100) : 0,
        }))
        setPaymentDistribution(distribution.length > 0 ? distribution : [{ label: 'Bank Transfer', percent: 100 }])
      } catch (e: unknown) {
        console.error('Failed to load reports:', e)
        setErrorMsg(e instanceof Error ? e.message : 'Gagal memuat laporan')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [supabase,periodFilter, dateRange.start, dateRange.end])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const percent = (n: number) => `${n}%`

  const getSegmentBadge = (segment: string) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800',
      regular: 'bg-green-100 text-green-800',
      vip: 'bg-purple-100 text-purple-800'
    }

    const labels = {
      new: 'Baru',
      regular: 'Reguler',
      vip: 'VIP'
    }

    return (
      <Badge variant="secondary" className={variants[segment as keyof typeof variants]}>
        {labels[segment as keyof typeof labels]}
      </Badge>
    )
  }

  // Removed legacy handleExportPDF in favor of React-PDF

  const handleExportExcel = () => {
    alert('Fitur export Excel akan segera tersedia')
  }

  // Calculate summary stats
  const totalRevenue = salesData.reduce((sum, data) => sum + data.revenue, 0)
  const totalOrders = salesData.reduce((sum, data) => sum + data.orders, 0)
  const totalCustomers = customerData.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const profitMargin = totalRevenue > 0 ? 100 : 0

  // Growth vs previous period
  const revenueGrowth = (() => {
    // previous total revenue approximated using the first half vs second half
    if (salesData.length < 2) return 0
    const mid = Math.floor(salesData.length / 2)
    const prev = salesData.slice(0, mid).reduce((s, d) => s + d.revenue, 0)
    const curr = salesData.slice(mid).reduce((s, d) => s + d.revenue, 0)
    if (prev === 0) return 0
    return Math.round(((curr - prev) / prev) * 100)
  })()
  const ordersGrowth = (() => {
    if (salesData.length < 2) return 0
    const mid = Math.floor(salesData.length / 2)
    const prev = salesData.slice(0, mid).reduce((s, d) => s + d.orders, 0)
    const curr = salesData.slice(mid).reduce((s, d) => s + d.orders, 0)
    if (prev === 0) return 0
    return Math.round(((curr - prev) / prev) * 100)
  })()
  const customersGrowth = customerData.length > 1 ? 0 : 0
  const profitGrowth = profitMargin

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Laporan & Analitik
          </h1>
          <p className="text-gray-600 mt-1">
            Dashboard laporan lengkap untuk analisis bisnis
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <BarChart3 className="w-4 h-4 mr-1" />
          Admin Reports
        </Badge>
      </div>

      <div id="reports-content">

      {loading && (
        <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded">
          Memuat data laporan...
        </div>
      )}
      {errorMsg && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded">
          {errorMsg}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <p className="text-xs text-green-600">+{revenueGrowth}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <p className="text-xs text-green-600">+{ordersGrowth}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <p className="text-xs text-green-600">+{customersGrowth}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AOV</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Average Order Value
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{profitMargin}%</div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <p className="text-xs text-green-600">+{profitGrowth}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-4">
              <div className="md:w-48">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Hari Ini</option>
                  <option value="7">7 Hari Terakhir</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">3 Bulan Terakhir</option>
                  <option value="365">1 Tahun Terakhir</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Dari"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full sm:w-40"
                />
                <Input
                  type="date"
                  placeholder="Sampai"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full sm:w-40"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={compact ? 'secondary' : 'outline'}
                onClick={() => setCompact(v => !v)}
                aria-pressed={compact}
                className="text-gray-700 hover:bg-gray-50"
                title="Tampilkan tampilan ringkas untuk grafik"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                {compact ? 'Tampilan Ringkas: Aktif' : 'Tampilan Ringkas'}
              </Button>
              <ReportsExportButton
                summary={{
                  totalRevenue,
                  totalOrders,
                  totalCustomers,
                  averageOrderValue,
                  profitMargin,
                }}
                growth={{
                  revenueGrowth,
                  ordersGrowth,
                  customersGrowth,
                  profitGrowth,
                }}
                formatted={{ currency: formatCurrency, percent }}
                fileName={`Laporan-${new Date().toISOString().slice(0,10)}.pdf`}
              />
              <Button onClick={handleExportExcel} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div
        className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto"
        role="tablist"
        aria-label="Laporan Tabs"
        aria-orientation="horizontal"
      >
        <button
          id="tabbtn-sales"
          role="tab"
          aria-selected={activeTab === 'sales'}
          aria-controls="tab-sales"
          tabIndex={activeTab === 'sales' ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, 'sales')}
          onClick={() => setActiveTab('sales')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            activeTab === 'sales'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2 inline" />
          Laporan Penjualan
        </button>
        <button
          id="tabbtn-customers"
          role="tab"
          aria-selected={activeTab === 'customers'}
          aria-controls="tab-customers"
          tabIndex={activeTab === 'customers' ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, 'customers')}
          onClick={() => setActiveTab('customers')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            activeTab === 'customers'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 mr-2 inline" />
          Laporan Pelanggan
        </button>
        <button
          id="tabbtn-financial"
          role="tab"
          aria-selected={activeTab === 'financial'}
          aria-controls="tab-financial"
          tabIndex={activeTab === 'financial' ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, 'financial')}
          onClick={() => setActiveTab('financial')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            activeTab === 'financial'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4 mr-2 inline" />
          Laporan Keuangan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && (
        <section role="tabpanel" id="tab-sales" aria-labelledby="tabbtn-sales" className="space-y-4">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Penjualan</CardTitle>
              <CardDescription>
                Grafik penjualan harian untuk {periodFilter} hari terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-48 sm:h-64 overflow-hidden" style={{ touchAction: 'pan-y' }}>
                <div className="w-full flex items-end justify-between gap-1 sm:gap-2">
                  {salesData.map((data, index) => {
                    const maxRevenue = Math.max(...salesData.map(d => d.revenue))
                    const barBaseHeight = compact ? 140 : 200
                    const height = (data.revenue / maxRevenue) * barBaseHeight
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                          style={{ height: `${height}px` }}
                        ></div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                          {formatDate(data.date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produk Terlaris</CardTitle>
              <CardDescription>
                Produk dengan penjualan tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {productData.map((product, index) => {
                  const maxSales = Math.max(...productData.map(p => p.sales))
                  const percentage = (product.sales / maxSales) * 100
                  return (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} terjual</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {activeTab === 'customers' && (
        <section role="tabpanel" id="tab-customers" aria-labelledby="tabbtn-customers" className="space-y-4">
          {/* Customer Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Pertumbuhan Pelanggan</CardTitle>
              <CardDescription>
                Jumlah pelanggan baru per bulan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-48 sm:h-64 overflow-x-auto">
                <div className="min-w-[640px] flex items-end justify-between gap-2">
                  {(monthlyCustomers.length > 0 ? monthlyCustomers.map(mc => mc.count) : [0]).map((count, index) => {
                    const maxCount = Math.max(...(monthlyCustomers.length > 0 ? monthlyCustomers.map(mc => mc.count) : [1]))
                    const barBaseHeight = compact ? 140 : 200
                    const height = (count / maxCount) * barBaseHeight
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t transition-all duration-300 hover:from-purple-600 hover:to-purple-400"
                          style={{ height: `${height}px` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-2">{monthlyCustomers[index]?.month ?? ''}</div>
                        <div className="text-xs font-semibold text-gray-700">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Segmentation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Segmentasi Pelanggan</CardTitle>
                <CardDescription>
                  Distribusi pelanggan berdasarkan kategori
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {(() => {
                    const total = customerData.length || 1
                    const countNew = customerData.filter(c => c.segment === 'new').length
                    const countRegular = customerData.filter(c => c.segment === 'regular').length
                    const countVip = customerData.filter(c => c.segment === 'vip').length
                    const pct = (n: number) => Math.round((n / total) * 100)
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm">Pelanggan Baru</span>
                          </div>
                          <span className="font-semibold">{pct(countNew)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm">Pelanggan Reguler</span>
                          </div>
                          <span className="font-semibold">{pct(countRegular)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-purple-500 rounded"></div>
                            <span className="text-sm">Pelanggan VIP</span>
                          </div>
                          <span className="font-semibold">{pct(countVip)}%</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pelanggan</CardTitle>
                <CardDescription>
                  Pelanggan dengan nilai transaksi tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {customerData.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.orders} pesanan</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{formatCurrency(customer.totalSpent)}</span>
                        {getSegmentBadge(customer.segment)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {activeTab === 'financial' && (
        <section role="tabpanel" id="tab-financial" aria-labelledby="tabbtn-financial" className="space-y-4">
          {/* Revenue vs Costs */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Biaya</CardTitle>
              <CardDescription>
                Perbandingan pendapatan dan biaya operasional
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-48 sm:h-64 overflow-x-auto">
                <div className="min-w-[640px] flex items-end justify-between gap-2">
                  {financialData.map((data, index) => {
                    const maxValue = Math.max(...financialData.map(d => Math.max(d.revenue, d.costs)))
                    const barBaseHeight = compact ? 140 : 200
                    const revenueHeight = (data.revenue / maxValue) * barBaseHeight
                    const costHeight = (data.costs / maxValue) * barBaseHeight
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 space-y-1">
                        <div className="flex flex-col space-y-1 w-full">
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-300"
                            style={{ height: `${revenueHeight}px` }}
                          ></div>
                          <div
                            className="w-full bg-gradient-to-t from-red-500 to-red-300 rounded-b transition-all duration-300"
                            style={{ height: `${costHeight}px` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{data.month}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Biaya</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Statement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit/Loss Statement</CardTitle>
                <CardDescription>
                  Ringkasan keuangan bulanan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {financialData.slice(0, 6).map((data) => (
                    <div key={data.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{data.month}</p>
                        <p className="text-sm text-gray-500">Margin: {data.profitMargin}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(data.profit)}</p>
                        <p className="text-xs text-gray-500">Profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Distribusi metode pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {paymentDistribution.length === 0 && (
                  <div className="text-sm text-gray-500">Belum ada pembayaran terverifikasi pada periode ini</div>
                )}
                {paymentDistribution.map((p) => (
                  <div key={p.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">{p.label}</span>
                    </div>
                    <span className="font-semibold">{p.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </div>
        </section>
      )}
      </div>
    </div>
  )
}
