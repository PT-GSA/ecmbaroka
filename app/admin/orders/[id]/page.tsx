import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Package, Calendar, MapPin, Phone } from 'lucide-react'
import OrderStatusUpdate from '@/components/admin/order-status-update'
import PaymentVerification from '@/components/admin/payment-verification'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
    image_url: string | null
  }
}

interface OrderPageProps {
  params: {
    id: string
  }
}

export default async function AdminOrderDetailPage({ params }: OrderPageProps) {
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

  // Get order details
  const { data: order, error } = await supabase
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
        price_at_purchase,
        products (
          name,
          image_url
        )
      ),
      payments (
        id,
        proof_image_url,
        bank_name,
        account_name,
        transfer_date,
        amount,
        status,
        admin_notes,
        created_at
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !order) {
    notFound()
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Pesanan
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detail Pesanan #{order.id.slice(-8)}
          </h1>
          <p className="text-gray-600">
            Kelola dan verifikasi pesanan customer
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Informasi Pesanan</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.created_at)}
                    </span>
                  </CardDescription>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Customer</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{order.user_profiles?.full_name || 'Unknown User'}</p>
                  {order.user_profiles?.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="h-4 w-4" />
                      {order.user_profiles.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produk
                </h4>
                <div className="space-y-3">
                  {order.order_items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.products.image_url ? (
                          <Image
                            src={item.products.image_url}
                            alt={item.products.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x {formatCurrency(item.price_at_purchase)}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        {formatCurrency(item.price_at_purchase * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Shipping Info */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat Pengiriman
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{order.shipping_address}</p>
                  {order.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="h-4 w-4" />
                      {order.phone}
                    </p>
                  )}
                </div>
              </div>

              {order.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Catatan</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {order.notes}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment & Status Management */}
        <div className="space-y-6">
          {/* Payment Verification */}
          {order.payments && order.payments.length > 0 && (
            <PaymentVerification 
              payments={order.payments} 
              orderId={order.id}
            />
          )}

          {/* Order Status Update */}
          <OrderStatusUpdate 
            orderId={order.id}
            currentStatus={order.status}
          />
        </div>
      </div>
    </div>
  )
}
