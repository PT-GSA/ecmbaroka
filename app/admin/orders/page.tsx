'use client'

import { useState, useEffect } from 'react'
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

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  shipping_address: string
  phone?: string
  notes?: string
  user_profiles?: {
    full_name: string
    phone: string
  }
  order_items: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data untuk demo
    const mockOrders: Order[] = [
      {
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
              name: 'Susu Segar 1L',
              price: 25000
            }
          },
          {
            id: '2',
            quantity: 3,
            price_at_purchase: 15000,
            products: {
              name: 'Susu Pasteurisasi 500ml',
              price: 15000
            }
          }
        ]
      },
      {
        id: 'ORD002',
        created_at: '2024-01-14T14:20:00Z',
        status: 'processing',
        total_amount: 180000,
        shipping_address: 'Jl. Thamrin No. 456, Jakarta Pusat',
        phone: '+62 813-4567-8901',
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
              price: 20000
            }
          },
          {
            id: '4',
            quantity: 2,
            price_at_purchase: 50000,
            products: {
              name: 'Susu Premium 1L',
              price: 50000
            }
          }
        ]
      },
      {
        id: 'ORD003',
        created_at: '2024-01-13T09:15:00Z',
        status: 'pending',
        total_amount: 95000,
        shipping_address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
        phone: '+62 814-5678-9012',
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
              name: 'Susu Segar 1L',
              price: 25000
            }
          },
          {
            id: '6',
            quantity: 2,
            price_at_purchase: 35000,
            products: {
              name: 'Susu Organik 1L',
              price: 35000
            }
          }
        ]
      },
      {
        id: 'ORD004',
        created_at: '2024-01-12T16:45:00Z',
        status: 'shipped',
        total_amount: 320000,
        shipping_address: 'Jl. Kebon Jeruk No. 321, Jakarta Barat',
        phone: '+62 815-6789-0123',
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
              name: 'Susu Segar 1L',
              price: 25000
            }
          },
          {
            id: '8',
            quantity: 2,
            price_at_purchase: 35000,
            products: {
              name: 'Susu Organik 1L',
              price: 35000
            }
          },
          {
            id: '9',
            quantity: 1,
            price_at_purchase: 50000,
            products: {
              name: 'Susu Premium 1L',
              price: 50000
            }
          }
        ]
      },
      {
        id: 'ORD005',
        created_at: '2024-01-11T11:30:00Z',
        status: 'verified',
        total_amount: 150000,
        shipping_address: 'Jl. Senayan No. 654, Jakarta Selatan',
        phone: '+62 816-7890-1234',
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
              name: 'Susu Segar 1L',
              price: 25000
            }
          },
          {
            id: '11',
            quantity: 2,
            price_at_purchase: 50000,
            products: {
              name: 'Susu Premium 1L',
              price: 50000
            }
          }
        ]
      }
    ]

    setOrders(mockOrders)
    setLoading(false)
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Memuat pesanan...</span>
      </div>
    )
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
