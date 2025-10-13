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
import { ArrowLeft, Package, Calendar, MapPin, Phone, CreditCard, Upload } from 'lucide-react'
import PaymentUploadForm from '@/components/customer/payment-upload-form'

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
  order_items: OrderItem[]
  shipping_address: string
  phone: string | null
  notes: string | null
  total_amount: number
  payments: Payment[] | null
}

function assertOrder(value: unknown): asserts value is Order {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid order data')
  }
}

interface OrderPageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const supabase = await createClient()
  const { id } = params
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get order details
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
    .eq('user_id', user.id)
    .single()

  const { data: orderData, error } = orderResult
  if (error || !orderData) {
    notFound()
  }
  assertOrder(orderData)
  const order: Order = orderData

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/customer-orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Pesanan
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Pesanan #{order.id.slice(-8)}
                  </CardTitle>
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

        {/* Payment Section */}
        <div className="space-y-6">
          {/* Payment Instructions */}
          {order.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Instruksi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Transfer ke Rekening Berikut:
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Bank:</strong> BCA</p>
                    <p><strong>No. Rekening:</strong> 1234567890</p>
                    <p><strong>Atas Nama:</strong> Susu Baroka</p>
                    <p><strong>Jumlah:</strong> {formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Catatan Penting:
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Upload bukti transfer setelah melakukan pembayaran</li>
                    <li>• Pesanan akan diproses setelah pembayaran diverifikasi</li>
                    <li>• Estimasi pengiriman 2-3 hari kerja</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Upload Form */}
          {order.status === 'pending' && (
            <PaymentUploadForm orderId={order.id} />
          )}

          {/* Payment Status */}
          {paymentsWithSignedUrls && paymentsWithSignedUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Status Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentsWithSignedUrls.map((payment: Payment) => (
                  <div key={payment.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Bukti Transfer</span>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Bank:</span>
                          <p className="font-medium">{payment.bank_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Atas Nama:</span>
                          <p className="font-medium">{payment.account_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Tanggal Transfer:</span>
                          <p className="font-medium">{formatDate(payment.transfer_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Jumlah:</span>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                      
                      {payment.proof_image_url && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">Bukti Transfer:</span>
                          <div className="mt-2">
                            <Image 
                              src={payment.proof_image_url} 
                              alt="Bukti Transfer"
                              width={400}
                              height={300}
                              className="max-w-full h-auto rounded-lg border"
                            />
                          </div>
                        </div>
                      )}
                      
                      {payment.admin_notes && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">Catatan Admin:</span>
                          <p className="text-sm bg-white p-2 rounded border mt-1">
                            {payment.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
