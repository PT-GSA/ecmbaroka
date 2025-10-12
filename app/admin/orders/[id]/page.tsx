'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Package, Calendar, MapPin, Phone, FileText } from 'lucide-react'
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

interface Payment {
  id: string
  proof_image_url: string | null
  bank_name: string
  account_name: string
  transfer_date: string
  amount: number
  status: 'pending' | 'verified' | 'rejected' | 'completed'
  admin_notes: string | null
  created_at: string
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  shipping_address: string
  phone: string
  notes: string | null
  user_profiles: {
    full_name: string
    phone: string
  }
  order_items: OrderItem[]
  payments: Payment[]
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data berdasarkan ID
    const mockOrders: Record<string, Order> = {
      'ORD001': {
        id: 'ORD001',
        created_at: '2024-01-15T10:30:00Z',
        status: 'completed',
        total_amount: 250000,
        shipping_address: 'Jl. Sudirman No. 123, Jakarta Selatan',
        phone: '+62 812-3456-7890',
        notes: 'Mohon dikirim pagi hari',
        user_profiles: {
          full_name: 'John Doe',
          phone: '+62 812-3456-7890'
        },
        order_items: [
          {
            id: '1',
            quantity: 2,
            price_at_purchase: 25000,
            products: {
              name: 'Susu Steril 1L',
              image_url: null
            }
          },
          {
            id: '2',
            quantity: 3,
            price_at_purchase: 15000,
            products: {
              name: 'Susu Pasteurisasi 500ml',
              image_url: null
            }
          }
        ],
        payments: [
          {
            id: 'PAY001',
            proof_image_url: null,
            bank_name: 'BCA',
            account_name: 'John Doe',
            transfer_date: '2024-01-15T10:35:00Z',
            amount: 250000,
            status: 'verified',
            admin_notes: 'Pembayaran terverifikasi',
            created_at: '2024-01-15T10:35:00Z'
          }
        ]
      },
      'ORD002': {
        id: 'ORD002',
        created_at: '2024-01-14T14:20:00Z',
        status: 'processing',
        total_amount: 180000,
        shipping_address: 'Jl. Thamrin No. 456, Jakarta Pusat',
        phone: '+62 813-4567-8901',
        notes: null,
        user_profiles: {
          full_name: 'Jane Smith',
          phone: '+62 813-4567-8901'
        },
        order_items: [
          {
            id: '3',
            quantity: 4,
            price_at_purchase: 20000,
            products: {
              name: 'Susu Organik 1L',
              image_url: null
            }
          },
          {
            id: '4',
            quantity: 2,
            price_at_purchase: 50000,
            products: {
              name: 'Susu Premium 1L',
              image_url: null
            }
          }
        ],
        payments: [
          {
            id: 'PAY002',
            proof_image_url: null,
            bank_name: 'Mandiri',
            account_name: 'Jane Smith',
            transfer_date: '2024-01-14T14:25:00Z',
            amount: 180000,
            status: 'pending',
            admin_notes: null,
            created_at: '2024-01-14T14:25:00Z'
          }
        ]
      },
      'ORD003': {
        id: 'ORD003',
        created_at: '2024-01-13T09:15:00Z',
        status: 'pending',
        total_amount: 95000,
        shipping_address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
        phone: '+62 814-5678-9012',
        notes: 'Tolong dikemas dengan baik',
        user_profiles: {
          full_name: 'Bob Johnson',
          phone: '+62 814-5678-9012'
        },
        order_items: [
          {
            id: '5',
            quantity: 1,
            price_at_purchase: 25000,
            products: {
              name: 'Susu Steril 1L',
              image_url: null
            }
          },
          {
            id: '6',
            quantity: 2,
            price_at_purchase: 35000,
            products: {
              name: 'Susu Organik 1L',
              image_url: null
            }
          }
        ],
        payments: []
      },
      'ORD004': {
        id: 'ORD004',
        created_at: '2024-01-12T16:45:00Z',
        status: 'shipped',
        total_amount: 320000,
        shipping_address: 'Jl. Kebon Jeruk No. 321, Jakarta Barat',
        phone: '+62 815-6789-0123',
        notes: null,
        user_profiles: {
          full_name: 'Alice Brown',
          phone: '+62 815-6789-0123'
        },
        order_items: [
          {
            id: '7',
            quantity: 3,
            price_at_purchase: 25000,
            products: {
              name: 'Susu Steril 1L',
              image_url: null
            }
          },
          {
            id: '8',
            quantity: 2,
            price_at_purchase: 35000,
            products: {
              name: 'Susu Organik 1L',
              image_url: null
            }
          },
          {
            id: '9',
            quantity: 1,
            price_at_purchase: 50000,
            products: {
              name: 'Susu Premium 1L',
              image_url: null
            }
          }
        ],
        payments: [
          {
            id: 'PAY004',
            proof_image_url: null,
            bank_name: 'BNI',
            account_name: 'Alice Brown',
            transfer_date: '2024-01-12T16:50:00Z',
            amount: 320000,
            status: 'verified',
            admin_notes: 'Pembayaran sudah diterima',
            created_at: '2024-01-12T16:50:00Z'
          }
        ]
      },
      'ORD005': {
        id: 'ORD005',
        created_at: '2024-01-11T11:30:00Z',
        status: 'verified',
        total_amount: 150000,
        shipping_address: 'Jl. Senayan No. 654, Jakarta Selatan',
        phone: '+62 816-7890-1234',
        notes: 'Mohon dikirim sore hari',
        user_profiles: {
          full_name: 'Charlie Wilson',
          phone: '+62 816-7890-1234'
        },
        order_items: [
          {
            id: '10',
            quantity: 2,
            price_at_purchase: 25000,
            products: {
              name: 'Susu Steril 1L',
              image_url: null
            }
          },
          {
            id: '11',
            quantity: 2,
            price_at_purchase: 50000,
            products: {
              name: 'Susu Premium 1L',
              image_url: null
            }
          }
        ],
        payments: [
          {
            id: 'PAY005',
            proof_image_url: null,
            bank_name: 'BCA',
            account_name: 'Charlie Wilson',
            transfer_date: '2024-01-11T11:35:00Z',
            amount: 150000,
            status: 'verified',
            admin_notes: 'Menunggu konfirmasi admin',
            created_at: '2024-01-11T11:35:00Z'
          }
        ]
      }
    }

    const selectedOrder = mockOrders[id]
    if (selectedOrder) {
      setOrder(selectedOrder)
    }
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Memuat detail pesanan...</span>
      </div>
    )
  }

  if (!order) {
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
