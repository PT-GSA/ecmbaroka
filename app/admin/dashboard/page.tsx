'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  type OrderRow = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status' | 'total_amount'>
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([])
  type ProductRowSlim = Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name' | 'stock'>
  const [lowStockProducts, setLowStockProducts] = useState<ProductRowSlim[]>([])
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setErrorMsg('')
      try {
        // Orders counts
        const totalOrdersRes = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
        if (totalOrdersRes.error) throw new Error(totalOrdersRes.error.message)
        const totalOrders = totalOrdersRes.count ?? 0

        const pendingOrdersRes = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
        if (pendingOrdersRes.error) throw new Error(pendingOrdersRes.error.message)
        const pendingOrders = pendingOrdersRes.count ?? 0

        const completedOrdersRes = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
        if (completedOrdersRes.error) throw new Error(completedOrdersRes.error.message)
        const completedOrders = completedOrdersRes.count ?? 0

        // Products count
        const productsRes = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
        if (productsRes.error) throw new Error(productsRes.error.message)
        const totalProducts = productsRes.count ?? 0

        // Customers count
        const customersRes = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'customer')
        if (customersRes.error) throw new Error(customersRes.error.message)
        const totalCustomers = customersRes.count ?? 0

        // Total revenue (verified payments)
        type PaymentRowSlim = Pick<Database['public']['Tables']['payments']['Row'], 'amount' | 'status'>
        const paymentsRes = await supabase
          .from('payments')
          .select('amount, status')
          .eq('status', 'verified')
        if (paymentsRes.error) throw new Error(paymentsRes.error.message)
        const payments = (paymentsRes.data ?? []) as PaymentRowSlim[]
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)

        setStats({
          totalOrders,
          totalProducts,
          totalCustomers,
          totalRevenue,
          pendingOrders,
          completedOrders,
        })

        // Recent orders
        const recentRes = await supabase
          .from('orders')
          .select('id, created_at, status, total_amount')
          .order('created_at', { ascending: false })
          .limit(3)
        if (recentRes.error) throw new Error(recentRes.error.message)
        const recents = (recentRes.data ?? []) as OrderRow[]
        setRecentOrders(recents)

        // Low stock products (threshold <= 10)
        const lowStockRes = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('is_active', true)
          .lte('stock', 10)
          .order('stock', { ascending: true })
          .limit(5)
        if (lowStockRes.error) throw new Error(lowStockRes.error.message)
        setLowStockProducts((lowStockRes.data ?? []) as ProductRowSlim[])

        // Pending payments needing confirmation
        const pendingPaymentsRes = await supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
        if (pendingPaymentsRes.error) throw new Error(pendingPaymentsRes.error.message)
        setPendingPaymentsCount(pendingPaymentsRes.count ?? 0)
      } catch (e: unknown) {
        console.error('Failed to load dashboard:', e)
        setErrorMsg(e instanceof Error ? e.message : 'Gagal memuat dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Admin
          </h1>
          <p className="text-gray-600 mt-1">
            Panel administrasi Susu Baroka
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Users className="w-4 h-4 mr-1" />
          Administrator
        </Badge>
      </div>

      {loading && (
        <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded">Memuat data dashboard...</div>
      )}
      {errorMsg && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded">{errorMsg}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +12% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produk aktif
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +8% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +15% dari bulan lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Pesanan Pending
            </CardTitle>
            <CardDescription>
              Pesanan yang menunggu konfirmasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
            <Button variant="outline" asChild className="mt-4 w-full">
              <Link href="/admin/orders">
                Kelola Pesanan
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Pesanan Selesai
            </CardTitle>
            <CardDescription>
              Pesanan yang telah selesai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completedOrders}</div>
            <Button variant="outline" asChild className="mt-4 w-full">
              <Link href="/admin/orders">
                Lihat Riwayat
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
              Pertumbuhan
            </CardTitle>
            <CardDescription>
              Statistik pertumbuhan bisnis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Pesanan</span>
                <span className="text-sm font-medium text-green-600">+12%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pelanggan</span>
                <span className="text-sm font-medium text-green-600">+8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pendapatan</span>
                <span className="text-sm font-medium text-green-600">+15%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Akses fitur administrasi utama
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/products">
                <Package className="mr-2 h-4 w-4" />
                Kelola Produk
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Kelola Pesanan
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/customers">
                <Users className="mr-2 h-4 w-4" />
                Kelola Pelanggan
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
            <CardDescription>
              Pesanan yang baru masuk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 && !loading && (
                <div className="text-sm text-gray-600">Belum ada pesanan terbaru.</div>
              )}
              {recentOrders.map((o) => {
                const statusLabel = (() => {
                  switch (o.status) {
                    case 'pending': return 'Pending'
                    case 'paid': return 'Dibayar'
                    case 'verified': return 'Terverifikasi'
                    case 'processing': return 'Proses'
                    case 'shipped': return 'Dikirim'
                    case 'completed': return 'Selesai'
                    case 'cancelled': return 'Dibatalkan'
                    default: return o.status
                  }
                })()
                const badgeClass = (() => {
                  switch (o.status) {
                    case 'pending': return 'bg-orange-100 text-orange-800'
                    case 'completed': return 'bg-green-100 text-green-800'
                    case 'cancelled': return 'bg-red-100 text-red-800'
                    default: return 'bg-blue-100 text-blue-800'
                  }
                })()
                return (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Order #{o.id.slice(0,6).toUpperCase()}</p>
                      <p className="text-sm text-gray-600">Total {formatCurrency(Number(o.total_amount))}</p>
                    </div>
                    <Badge variant="secondary" className={badgeClass}>{statusLabel}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications (live) */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
            Peringatan & Notifikasi
          </CardTitle>
          <CardDescription>
            Informasi penting yang perlu perhatian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading && (
              <div className="text-sm text-gray-700">Memuat peringatan...</div>
            )}
            {!loading && lowStockProducts.length === 0 && pendingPaymentsCount === 0 && (
              <div className="text-sm text-gray-600">Tidak ada peringatan saat ini.</div>
            )}

            {/* Low stock alerts */}
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">Stok {p.name} Menipis</p>
                  <p className="text-sm text-gray-600">Sisa {p.stock} unit, segera restock</p>
                </div>
              </div>
            ))}

            {/* Pending payments alerts */}
            {pendingPaymentsCount > 0 && (
              <div className="flex items-center p-3 bg-white rounded-lg border border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">{pendingPaymentsCount} Pembayaran Menunggu Konfirmasi</p>
                  <p className="text-sm text-gray-600">Periksa dan konfirmasi bukti pembayaran</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}