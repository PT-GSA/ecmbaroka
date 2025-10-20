'use client'

import { useState, useEffect } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
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
        const res = await fetch('/api/admin/stats', { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!res.ok) {
          if (res.status === 405) {
            throw new Error('Method not allowed - kemungkinan masalah dengan middleware atau konfigurasi server')
          }
          if (res.status === 401) {
            throw new Error('Unauthorized - silakan login ulang sebagai admin')
          }
          if (res.status === 403) {
            throw new Error('Forbidden - Anda tidak memiliki akses admin')
          }
          
          const body = await res.json().catch(() => ({ error: 'Gagal memuat' }))
          throw new Error(body.error || `Gagal memuat (${res.status})`)
        }
        
        const data: {
          stats: {
            totalOrders: number
            totalProducts: number
            totalCustomers: number
            totalRevenue: number
            pendingOrders: number
            completedOrders: number
          }
          recentOrders: OrderRow[]
          lowStockProducts: ProductRowSlim[]
          pendingPaymentsCount: number
        } = await res.json()

        setStats(data.stats)
        setRecentOrders(data.recentOrders)
        setLowStockProducts(data.lowStockProducts)
        setPendingPaymentsCount(data.pendingPaymentsCount)
      } catch (e: unknown) {
        console.error('Failed to load dashboard:', e)
        setErrorMsg(e instanceof Error ? e.message : 'Gagal memuat dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
              <>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
                    <Skeleton className="h-4 w-4 mr-3 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                ))}
              </>
            )}
            {!loading && lowStockProducts.length === 0 && pendingPaymentsCount === 0 && (
              <div className="text-sm text-gray-600">Tidak ada peringatan saat ini.</div>
            )}

            {/* Low stock alerts */}
            {!loading && lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">Stok {p.name} Menipis</p>
                  <p className="text-sm text-gray-600">Sisa {p.stock} unit, segera restock</p>
                </div>
              </div>
            ))}

            {/* Pending payments alerts */}
            {!loading && pendingPaymentsCount > 0 && (
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
            {loading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">+12% dari bulan lalu</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-24 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Produk aktif</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">+8% dari bulan lalu</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-36 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">+15% dari bulan lalu</p>
              </>
            )}
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
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
            )}
            {loading ? (
              <Skeleton className="h-9 w-full mt-4" />
            ) : (
              <Button variant="outline" asChild className="mt-4 w-full">
                <Link href="/admin/orders">Kelola Pesanan</Link>
              </Button>
            )}
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
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{stats.completedOrders}</div>
            )}
            {loading ? (
              <Skeleton className="h-9 w-full mt-4" />
            ) : (
              <Button variant="outline" asChild className="mt-4 w-full">
                <Link href="/admin/orders">Lihat Riwayat</Link>
              </Button>
            )}
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
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
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
            )}
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
              {loading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  ))}
                </>
              )}
              {recentOrders.length === 0 && !loading && (
                <div className="text-sm text-gray-600">Belum ada pesanan terbaru.</div>
              )}
              {!loading && recentOrders.map((o) => {
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

      
    </div>
  )
}