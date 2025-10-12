'use client'

import { useState, useEffect, useCallback, type KeyboardEvent } from 'react'
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

  // Mock data
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [customerData, setCustomerData] = useState<CustomerData[]>([])
  const [financialData, setFinancialData] = useState<FinancialData[]>([])

  const generateMockData = useCallback(() => {
    // Sales data
    const sales: SalesData[] = []
    const days = parseInt(periodFilter)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      sales.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500000) + 100000,
        orders: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 15) + 3
      })
    }
    setSalesData(sales)

    // Product data
    const products: ProductData[] = [
      { id: 'P001', name: 'Susu Steril 1L', sales: 45, revenue: 1125000, quantity: 45 },
      { id: 'P002', name: 'Susu Pasteurisasi 500ml', sales: 38, revenue: 570000, quantity: 38 },
      { id: 'P003', name: 'Susu Organik 1L', sales: 32, revenue: 1120000, quantity: 32 },
      { id: 'P004', name: 'Susu Premium 1L', sales: 28, revenue: 980000, quantity: 28 },
      { id: 'P005', name: 'Susu UHT 250ml', sales: 25, revenue: 375000, quantity: 25 }
    ]
    setProductData(products)

    // Customer data
    const customers: CustomerData[] = [
      { id: 'C001', name: 'John Doe', orders: 15, totalSpent: 450000, lastOrder: '2024-01-15', segment: 'vip' },
      { id: 'C002', name: 'Jane Smith', orders: 8, totalSpent: 280000, lastOrder: '2024-01-14', segment: 'regular' },
      { id: 'C003', name: 'Bob Johnson', orders: 3, totalSpent: 95000, lastOrder: '2024-01-08', segment: 'new' },
      { id: 'C004', name: 'Alice Brown', orders: 22, totalSpent: 680000, lastOrder: '2024-01-15', segment: 'vip' },
      { id: 'C005', name: 'Charlie Wilson', orders: 1, totalSpent: 25000, lastOrder: '2023-12-01', segment: 'new' },
      { id: 'C006', name: 'Diana Lee', orders: 12, totalSpent: 380000, lastOrder: '2024-01-13', segment: 'regular' },
      { id: 'C007', name: 'Eva Davis', orders: 18, totalSpent: 520000, lastOrder: '2024-01-12', segment: 'vip' },
      { id: 'C008', name: 'Frank Miller', orders: 6, totalSpent: 180000, lastOrder: '2024-01-10', segment: 'regular' }
    ]
    setCustomerData(customers)

    // Financial data
    const financial: FinancialData[] = [
      { month: 'Jan 2024', revenue: 4500000, costs: 2700000, profit: 1800000, profitMargin: 40 },
      { month: 'Dec 2023', revenue: 4200000, costs: 2520000, profit: 1680000, profitMargin: 40 },
      { month: 'Nov 2023', revenue: 3800000, costs: 2280000, profit: 1520000, profitMargin: 40 },
      { month: 'Oct 2023', revenue: 4100000, costs: 2460000, profit: 1640000, profitMargin: 40 },
      { month: 'Sep 2023', revenue: 3900000, costs: 2340000, profit: 1560000, profitMargin: 40 },
      { month: 'Aug 2023', revenue: 3600000, costs: 2160000, profit: 1440000, profitMargin: 40 }
    ]
    setFinancialData(financial)
  }, [periodFilter])

  useEffect(() => {
    // Generate mock data based on period filter
    generateMockData()
  }, [generateMockData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
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
  const totalCustomers = salesData.length > 0 ? Math.max(...salesData.map(d => d.customers)) : 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const profitMargin = financialData[0]?.profitMargin || 0

  // Calculate growth rates (mock)
  const revenueGrowth = 12.5
  const ordersGrowth = 8.3
  const customersGrowth = 15.2
  const profitGrowth = 7.8

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
                  {[45, 52, 38, 61, 48, 55, 67].map((count, index) => {
                    const maxCount = Math.max(...[45, 52, 38, 61, 48, 55, 67])
                    const barBaseHeight = compact ? 140 : 200
                    const height = (count / maxCount) * barBaseHeight
                    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t transition-all duration-300 hover:from-purple-600 hover:to-purple-400"
                          style={{ height: `${height}px` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-2">{months[index]}</div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">Pelanggan Baru</span>
                    </div>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">Pelanggan Reguler</span>
                    </div>
                    <span className="font-semibold">60%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="text-sm">Pelanggan VIP</span>
                    </div>
                    <span className="font-semibold">15%</span>
                  </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Bank Transfer</span>
                  </div>
                  <span className="font-semibold">100%</span>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="text-sm">Semua transaksi menggunakan Bank Transfer</p>
                </div>
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
