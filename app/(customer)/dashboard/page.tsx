import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StatsCard from '@/components/customer/stats-card'
import QuickActionCard from '@/components/customer/quick-action-card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Database } from '@/types/database'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  Plus,
  User,
  Calendar,
  ArrowRight
} from 'lucide-react'

type OrderWithItems = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: Pick<Database['public']['Tables']['products']['Row'], 'name'>
  })[]
}

export default async function CustomerDashboard() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user orders
  const { data, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_at_purchase,
        products (
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orders = data as OrderWithItems[]

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
  }

  // Calculate statistics
  const totalOrders = orders?.length || 0
  const totalSpending = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const activeOrders = orders?.filter(order => 
    ['pending', 'paid', 'verified', 'processing', 'shipped'].includes(order.status)
  ).length || 0
  const completedOrders = orders?.filter(order => order.status === 'completed').length || 0

  // Get recent orders (last 5)
  const recentOrders = orders?.slice(0, 5) || []

  // Calculate order status distribution (ensure proper typing)
  const statusDistribution: Record<string, number> = orders?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, label: 'Menunggu Pembayaran' },
      paid: { variant: 'secondary' as const, label: 'Menunggu Verifikasi' },
      verified: { variant: 'default' as const, label: 'Terverifikasi' },
      processing: { variant: 'default' as const, label: 'Sedang Diproses' },
      shipped: { variant: 'success' as const, label: 'Sedang Dikirim' },
      completed: { variant: 'success' as const, label: 'Selesai' },
      cancelled: { variant: 'destructive' as const, label: 'Dibatalkan' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Selamat datang! Kelola pesanan dan aktivitas Anda di sini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Pesanan"
          value={totalOrders}
          icon={Package}
          description="Semua pesanan Anda"
        />
        <StatsCard
          title="Total Pembelanjaan"
          value={formatCurrency(totalSpending)}
          icon={TrendingUp}
          description="Akumulasi semua transaksi"
        />
        <StatsCard
          title="Pesanan Aktif"
          value={activeOrders}
          icon={ShoppingCart}
          description="Sedang diproses"
        />
        <StatsCard
          title="Pesanan Selesai"
          value={completedOrders}
          icon={CheckCircle}
          description="Transaksi berhasil"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Order Produk"
            description="Lihat dan pesan produk susu Baroka"
            icon={Plus}
            href="/products"
            variant="primary"
          />
          <QuickActionCard
            title="Lihat Pesanan"
            description="Kelola dan lacak pesanan Anda"
            icon={Package}
            href="/customer-orders"
          />
          <QuickActionCard
            title="Lihat Keranjang"
            description="Produk yang akan dibeli"
            icon={ShoppingCart}
            href="/cart"
          />
          <QuickActionCard
            title="Edit Profile"
            description="Ubah informasi akun Anda"
            icon={User}
            href="/profile"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pesanan Terbaru</CardTitle>
                  <CardDescription>
                    {recentOrders.length > 0 
                      ? `${recentOrders.length} pesanan terbaru`
                      : 'Belum ada pesanan'
                    }
                  </CardDescription>
                </div>
                {recentOrders.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/customer-orders">
                      Lihat Semua
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Pesanan #{order.id.slice(-8)}</h4>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {order.order_items.length} item
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Belum Ada Pesanan
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Mulai belanja untuk melihat pesanan Anda di sini.
                  </p>
                  <Button asChild>
                    <Link href="/products">
                      Mulai Belanja
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Status Distribution */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status Pesanan</CardTitle>
              <CardDescription>
                Distribusi status pesanan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(statusDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Belum ada data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}