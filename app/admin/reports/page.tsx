'use client'

import { useState, useEffect, type KeyboardEvent } from 'react'
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

        // SalesData per day - Fixed to use completed orders only
        const daysSpan: string[] = []
        const cursor = new Date(startDate)
        while (cursor <= endDate) {
          daysSpan.push(new Date(cursor).toISOString().slice(0, 10))
          cursor.setDate(cursor.getDate() + 1)
        }
        const dailySales: SalesData[] = daysSpan.map((d) => {
          // Use completed orders for revenue calculation
          const dayCompletedOrders = orders.filter(o => 
            o.created_at.slice(0,10) === d && o.status === 'completed'
          )
          const revenue = dayCompletedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
          
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

        // Top customers - Fixed to use completed orders only
        const byUser = new Map<string, { orders: OrderRow[], completedOrders: OrderRow[] }>()
        orders.forEach(o => {
          const bucket = byUser.get(o.user_id) ?? { orders: [], completedOrders: [] }
          bucket.orders.push(o)
          if (o.status === 'completed') {
            bucket.completedOrders.push(o)
          }
          byUser.set(o.user_id, bucket)
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
          // Use completed orders for total spent calculation
          const totalSpent = data.completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
          const lastOrder = data.orders
            .sort((orderA, orderB) => orderB.created_at.localeCompare(orderA.created_at))[0]?.created_at ?? ''
          const segment: CustomerData['segment'] = ordersCount > 10 ? 'vip' : ordersCount > 3 ? 'regular' : 'new'
          return { id: uid, name, orders: ordersCount, totalSpent, lastOrder: lastOrder.slice(0,10), segment }
        })
        setCustomerData(
          customersComputed.sort((customerA, customerB) => customerB.totalSpent - customerA.totalSpent)
        )

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
          // Use completed orders for revenue calculation instead of payments
          const completedOrdersInMonth = orders.filter(o => {
            const orderDate = new Date(o.created_at)
            return o.status === 'completed' && 
                   orderDate >= m.start && 
                   orderDate <= new Date(m.end.getFullYear(), m.end.getMonth(), m.end.getDate(), 23, 59, 59)
          })
          const sum = completedOrdersInMonth.reduce((s, o) => s + Number(o.total_amount), 0)
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
            .select('id', { count: 'exact' })
            .gte('created_at', m.start.toISOString())
            .lte('created_at', new Date(m.end.getFullYear(), m.end.getMonth(), m.end.getDate(), 23, 59, 59).toISOString())
            .range(0, 0)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Modern Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Laporan & Analitik
                    </h1>
                    <p className="text-gray-600 text-lg">Dashboard laporan lengkap untuk analisis bisnis</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Admin Reports
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div id="reports-content">

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">Memuat Data Laporan</h3>
                <p className="text-blue-700 text-sm">Mohon tunggu sebentar...</p>
              </div>
            </div>
          </div>
        )}
        
        {errorMsg && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200 shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Gagal Memuat Data</h3>
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{revenueGrowth}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-sm font-bold text-gray-900">{totalOrders}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{ordersGrowth}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-sm font-bold text-gray-900">{totalCustomers}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{customersGrowth}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">AOV</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(averageOrderValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Average Order Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-sm font-bold text-emerald-600">{profitMargin}%</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{profitGrowth}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filter & Export</h3>
              <p className="text-sm text-gray-600">Atur periode dan ekspor laporan</p>
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 flex flex-col lg:flex-row gap-4">
              <div className="lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="1">Hari Ini</option>
                  <option value="7">7 Hari Terakhir</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">3 Bulan Terakhir</option>
                  <option value="365">1 Tahun Terakhir</option>
                </select>
              </div>
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
                  <Input
                    type="date"
                    placeholder="Dari"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
                  <Input
                    type="date"
                    placeholder="Sampai"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant={compact ? 'secondary' : 'outline'}
                onClick={() => setCompact(v => !v)}
                aria-pressed={compact}
                className="text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                title="Tampilkan tampilan ringkas untuk grafik"
              >
                <Minimize2 className="w-4 h-4" />
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
              <Button onClick={handleExportExcel} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-2">
          <div
            className="flex space-x-1 bg-gray-100 p-1 rounded-xl overflow-x-auto"
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
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === 'sales'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === 'customers'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === 'financial'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-4 h-4 mr-2 inline" />
              Laporan Keuangan
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'sales' && (
          <section role="tabpanel" id="tab-sales" aria-labelledby="tabbtn-sales" className="space-y-6">
            {/* Sales Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Trend Penjualan</h3>
                  <p className="text-sm text-gray-600">Grafik penjualan harian untuk {periodFilter} hari terakhir</p>
                </div>
              </div>
              <div className="h-64 overflow-x-auto">
                <div className="min-w-[600px] flex items-end justify-between gap-1 sm:gap-2">
                  {salesData.map((data, index) => {
                    const maxRevenue = Math.max(...salesData.map(d => d.revenue))
                    const barBaseHeight = compact ? 140 : 200
                    const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * barBaseHeight : 0
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 min-w-[40px]">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-400 hover:shadow-lg"
                          style={{ height: `${height}px` }}
                          title={`${formatDate(data.date)}: ${formatCurrency(data.revenue)}`}
                        ></div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                          {formatDate(data.date)}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-1">
                          {formatCurrency(data.revenue)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Top 5 Produk Terlaris</h3>
                  <p className="text-sm text-gray-600">Produk dengan penjualan tertinggi</p>
                </div>
              </div>
              <div className="space-y-4">
                {productData.map((product, index) => {
                  const maxSales = Math.max(...productData.map(p => p.sales))
                  const percentage = (product.sales / maxSales) * 100
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-sm font-semibold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} terjual</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'customers' && (
          <section role="tabpanel" id="tab-customers" aria-labelledby="tabbtn-customers" className="space-y-6">
            {/* Customer Growth */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pertumbuhan Pelanggan</h3>
                  <p className="text-sm text-gray-600">Jumlah pelanggan baru per bulan</p>
                </div>
              </div>
              <div className="h-64 overflow-x-auto">
                <div className="min-w-[600px] flex items-end justify-between gap-2">
                  {(monthlyCustomers.length > 0 ? monthlyCustomers.map(mc => mc.count) : [0]).map((count, index) => {
                    const maxCount = Math.max(...(monthlyCustomers.length > 0 ? monthlyCustomers.map(mc => mc.count) : [1]))
                    const barBaseHeight = compact ? 140 : 200
                    const height = maxCount > 0 ? (count / maxCount) * barBaseHeight : 0
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 min-w-[60px]">
                        <div
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg transition-all duration-300 hover:from-purple-600 hover:to-purple-400 hover:shadow-lg"
                          style={{ height: `${height}px` }}
                          title={`${monthlyCustomers[index]?.month ?? ''}: ${count} pelanggan`}
                        ></div>
                        <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">{monthlyCustomers[index]?.month ?? ''}</div>
                        <div className="text-xs font-semibold text-gray-700">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Customer Segmentation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Segmentasi Pelanggan</h3>
                    <p className="text-sm text-gray-600">Distribusi pelanggan berdasarkan kategori</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const total = customerData.length || 1
                    const countNew = customerData.filter(c => c.segment === 'new').length
                    const countRegular = customerData.filter(c => c.segment === 'regular').length
                    const countVip = customerData.filter(c => c.segment === 'vip').length
                    const pct = (n: number) => Math.round((n / total) * 100)
                    return (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm font-medium">Pelanggan Baru</span>
                          </div>
                          <span className="font-semibold text-gray-900">{pct(countNew)}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm font-medium">Pelanggan Reguler</span>
                          </div>
                          <span className="font-semibold text-gray-900">{pct(countRegular)}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-purple-500 rounded"></div>
                            <span className="text-sm font-medium">Pelanggan VIP</span>
                          </div>
                          <span className="font-semibold text-gray-900">{pct(countVip)}%</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Top Pelanggan</h3>
                    <p className="text-sm text-gray-600">Pelanggan dengan nilai transaksi tertinggi</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {customerData.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.orders} pesanan</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</span>
                        {getSegmentBadge(customer.segment)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'financial' && (
          <section role="tabpanel" id="tab-financial" aria-labelledby="tabbtn-financial" className="space-y-6">
            {/* Revenue vs Costs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue vs Biaya</h3>
                  <p className="text-sm text-gray-600">Perbandingan pendapatan dan biaya operasional</p>
                </div>
              </div>
              <div className="h-64 overflow-x-auto">
                <div className="min-w-[600px] flex items-end justify-between gap-2">
                  {financialData.map((data, index) => {
                    const maxValue = Math.max(...financialData.map(d => Math.max(d.revenue, d.costs)))
                    const barBaseHeight = compact ? 140 : 200
                    const revenueHeight = maxValue > 0 ? (data.revenue / maxValue) * barBaseHeight : 0
                    const costHeight = maxValue > 0 ? (data.costs / maxValue) * barBaseHeight : 0
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 min-w-[60px]">
                        <div className="flex flex-col space-y-1 w-full">
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-400 hover:shadow-lg"
                            style={{ height: `${revenueHeight}px` }}
                            title={`Revenue: ${formatCurrency(data.revenue)}`}
                          ></div>
                          <div
                            className="w-full bg-gradient-to-t from-red-500 to-red-300 rounded-b-lg transition-all duration-300 hover:from-red-600 hover:to-red-400 hover:shadow-lg"
                            style={{ height: `${costHeight}px` }}
                            title={`Costs: ${formatCurrency(data.costs)}`}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">{data.month}</div>
                        <div className="text-xs font-semibold text-gray-700">{formatCurrency(data.profit)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-center space-x-6 mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm font-medium">Biaya</span>
                </div>
              </div>
            </div>

            {/* Profit/Loss Statement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Profit/Loss Statement</h3>
                    <p className="text-sm text-gray-600">Ringkasan keuangan bulanan</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {financialData.slice(0, 6).map((data) => (
                    <div key={data.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{data.month}</p>
                        <p className="text-sm text-gray-500">Margin: {data.profitMargin}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(data.profit)}</p>
                        <p className="text-xs text-gray-500">Profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                    <p className="text-sm text-gray-600">Distribusi metode pembayaran</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {paymentDistribution.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">Belum ada pembayaran terverifikasi pada periode ini</div>
                  )}
                  {paymentDistribution.map((p) => (
                    <div key={p.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm font-medium">{p.label}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{p.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  )
}
