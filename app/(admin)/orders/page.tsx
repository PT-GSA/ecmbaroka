import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingCart, Eye, Package, MapPin, Phone } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
    price: number
  }
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  
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

  // Get all orders with user info
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      user_profiles (
        full_name,
        phone
      ),
      order_items (
        id,
        quantity,
        products (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-600">
          Gagal memuat daftar pesanan. Silakan coba lagi nanti.
        </p>
      </div>
    )
  }

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kelola Pesanan</h1>
        <p className="text-gray-600">Mengelola dan melacak pesanan customer</p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Pesanan #{order.id.slice(-8)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {order.user_profiles?.full_name || 'Unknown User'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Produk
                  </h4>
                  <div className="space-y-1">
                    {order.order_items.map((item: OrderItem) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products.name} x {item.quantity}</span>
                        <span>{formatCurrency(item.products.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Shipping Info */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat Pengiriman
                  </h4>
                  <p className="text-sm text-gray-600">{order.shipping_address}</p>
                  {order.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.phone}
                    </p>
                  )}
                </div>

                {order.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Catatan</h4>
                      <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/orders/${order.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Belum Ada Pesanan
            </h2>
            <p className="text-gray-500">
              Belum ada pesanan dari customer
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
