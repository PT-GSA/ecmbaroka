import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Package, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Get dashboard statistics
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: pendingPayments },
    { count: completedOrders }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed')
  ])

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      created_at,
      user_profiles (
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      status,
      created_at,
      orders (
        id,
        user_profiles (
          full_name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

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

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, label: 'Menunggu Verifikasi' },
      verified: { variant: 'success' as const, label: 'Terverifikasi' },
      rejected: { variant: 'destructive' as const, label: 'Ditolak' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang di panel administrasi Susu Baroka</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Produk aktif di katalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Semua pesanan customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu verifikasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pesanan yang sudah selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
            <CardDescription>
              Daftar pesanan customer terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">#{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        {order.user_profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(order.total_amount)}
                      </p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Belum ada pesanan
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pembayaran Terbaru</CardTitle>
            <CardDescription>
              Daftar pembayaran yang perlu diverifikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments && recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">#{payment.orders?.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        {payment.orders?.user_profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(payment.amount)}
                      </p>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Belum ada pembayaran
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
