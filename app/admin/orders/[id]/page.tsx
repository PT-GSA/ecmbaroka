import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Package, Calendar, MapPin, Phone, FileText } from 'lucide-react'
import OrderStatusUpdate from '@/components/admin/order-status-update'
import PaymentVerification from '@/components/admin/payment-verification'
import type { Database } from '@/types/database'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
    image_url: string | null
  }
}

interface Payment {
  id: string
  proof_image_url: string | null
  bank_name: string
  account_name: string
  transfer_date: string
  amount: number
  status: 'pending' | 'verified' | 'rejected'
  admin_notes: string | null
  created_at: string
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  shipping_address: string
  phone: string | null
  notes: string | null
  user_profiles?: {
    full_name: string
    phone: string | null
  }
  order_items: OrderItem[]
  payments: Payment[] | null
}

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const supabase = await createClient()
  const { id } = await params

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Admin role guard
  type UserProfileRole = Pick<Database['public']['Tables']['user_profiles']['Row'], 'role'>
  const profileRoleResp = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const profileRole = profileRoleResp.data as UserProfileRole | null
  if (!profileRole || profileRole.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch order details
  type OrderRow = Database['public']['Tables']['orders']['Row']
  type OrderItemRow = Database['public']['Tables']['order_items']['Row']
  type ProductLite = Pick<Database['public']['Tables']['products']['Row'], 'name' | 'image_url'>
  type PaymentRow = Database['public']['Tables']['payments']['Row']
  type OrderJoined = OrderRow & {
    order_items: (OrderItemRow & { products: ProductLite })[]
    payments: PaymentRow[] | null
  }

  const orderResult = await supabase
    .from('orders')
    .select(`
      *,
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
    .eq('id', id)
    .single()

  const orderData = orderResult.data as OrderJoined | null
  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pesanan Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Pesanan dengan ID {id} tidak ditemukan</p>
          <Button asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2" />
              Kembali ke Orders
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Attach customer profile
  type UserProfileLite = Pick<Database['public']['Tables']['user_profiles']['Row'], 'full_name' | 'phone'>
  const customerProfileResp = await supabase
    .from('user_profiles')
    .select('full_name, phone')
    .eq('id', orderData.user_id)
    .maybeSingle()
  const customerProfile = customerProfileResp.data as UserProfileLite | null

  const order: Order = {
    id: orderData.id,
    created_at: orderData.created_at,
    status: orderData.status,
    total_amount: Number(orderData.total_amount),
    shipping_address: orderData.shipping_address,
    phone: orderData.phone ?? null,
    notes: orderData.notes ?? null,
    user_profiles: customerProfile ? {
      full_name: customerProfile.full_name ?? 'Unknown User',
      phone: customerProfile.phone ?? null,
    } : undefined,
    order_items: (orderData.order_items ?? []).map((oi: OrderJoined['order_items'][number]) => ({
      id: oi.id,
      quantity: oi.quantity,
      price_at_purchase: Number(oi.price_at_purchase),
      products: {
        name: oi.products?.name ?? 'Produk',
        image_url: oi.products?.image_url ?? null,
      }
    })),
    payments: (orderData.payments ?? []).map((p: PaymentRow) => ({
      id: p.id,
      proof_image_url: p.proof_image_url,
      bank_name: p.bank_name,
      account_name: p.account_name,
      transfer_date: p.transfer_date,
      amount: Number(p.amount),
      status: p.status,
      admin_notes: p.admin_notes,
      created_at: p.created_at,
    }))
  }

  // Prepare signed URLs for payment proofs if any
  const extractPathFromPublicUrl = (url: string) => {
    try {
      const pathname = new URL(url).pathname
      const marker = '/payment-proofs/'
      const idx = pathname.indexOf(marker)
      if (idx === -1) return null
      return pathname.substring(idx + marker.length)
    } catch {
      return null
    }
  }

  let paymentsWithSignedUrls: Payment[] = order.payments ?? []
  if (order.payments && order.payments.length > 0) {
    paymentsWithSignedUrls = await Promise.all(
      order.payments.map(async (p) => {
        if (!p.proof_image_url) return p
        const path = extractPathFromPublicUrl(p.proof_image_url)
        if (!path) return p
        const { data } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(path, 60 * 60)
        return {
          ...p,
          proof_image_url: data?.signedUrl ?? p.proof_image_url,
        }
      })
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
          {paymentsWithSignedUrls && paymentsWithSignedUrls.length > 0 && (
            <PaymentVerification 
              payments={paymentsWithSignedUrls} 
              orderId={order.id}
            />
          )}

          {/* Order Status Update */}
          <OrderStatusUpdate 
            orderId={order.id}
            currentStatus={order.status}
          />

          {/* Generate Invoice */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Invoice</CardTitle>
              <CardDescription>
                Generate dan kirim invoice ke customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/admin/orders/${order.id}/invoice`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}