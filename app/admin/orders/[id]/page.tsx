import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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
  const service = createServiceClient()
  type OrderRow = Database['public']['Tables']['orders']['Row']
  type OrderItemRow = Database['public']['Tables']['order_items']['Row']
  type ProductLite = Pick<Database['public']['Tables']['products']['Row'], 'name' | 'image_url'>
  type PaymentRow = Database['public']['Tables']['payments']['Row']
  type OrderJoined = OrderRow & {
    order_items: (OrderItemRow & { products: ProductLite })[]
    payments: PaymentRow[] | null
  }

  const orderResult = await service
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
  const customerProfileResp = await service
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Modern Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" asChild className="hover:bg-blue-100">
                    <Link href="/admin/orders" className="flex items-center">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali ke Pesanan
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Detail Pesanan #{order.id.slice(-8)}
                    </h1>
                    <p className="text-gray-600 text-lg">Kelola dan verifikasi pesanan customer</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(order.total_amount)}</p>
                  <p className="text-sm text-gray-500">Total Pesanan</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Pesanan</h3>
                    <p className="text-sm text-gray-600">Detail lengkap pesanan customer</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Tanggal Pesanan</p>
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Customer</h4>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl ml-10">
                    <p className="font-medium text-gray-900">{order.user_profiles?.full_name || 'Unknown User'}</p>
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Produk</h4>
                  </div>
                  <div className="space-y-3 ml-10">
                    {order.order_items.map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.products.image_url ? (
                            <Image
                              src={item.products.image_url}
                              alt={item.products.name}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.products.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {formatCurrency(item.price_at_purchase)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 text-lg">
                            {formatCurrency(item.price_at_purchase * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Alamat Pengiriman</h4>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl ml-10">
                    <p className="text-sm text-gray-700">{order.shipping_address}</p>
                    {order.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                        <Phone className="h-4 w-4" />
                        {order.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-yellow-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Catatan</h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl ml-10">
                      <p className="text-sm text-gray-700">{order.notes}</p>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Status Management */}
          <div className="space-y-6">
            {/* Payment Verification */}
            {paymentsWithSignedUrls && paymentsWithSignedUrls.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Verifikasi Pembayaran</h3>
                      <p className="text-sm text-gray-600">Verifikasi bukti pembayaran customer</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <PaymentVerification 
                    payments={paymentsWithSignedUrls} 
                    orderId={order.id}
                  />
                </div>
              </div>
            )}

            {/* Order Status Update */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Update Status Pesanan</h3>
                    <p className="text-sm text-gray-600">Ubah status pesanan sesuai progress</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <OrderStatusUpdate 
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </div>
            </div>

            {/* Generate Invoice */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invoice</h3>
                    <p className="text-sm text-gray-600">Generate dan kirim invoice ke customer</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Button asChild className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-12">
                  <Link href={`/admin/orders/${order.id}/invoice`}>
                    <FileText className="mr-2 h-5 w-5" />
                    Generate Invoice
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}