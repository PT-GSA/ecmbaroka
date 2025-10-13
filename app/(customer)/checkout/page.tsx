'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency} from '@/lib/utils'
import { ArrowLeft, CreditCard, MapPin } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
  }
}

interface Order {
  id: string
  total_amount: number
  status: string
  shipping_address: string
  phone: string
  notes: string | null
  order_items: OrderItem[]
}

function CheckoutContent() {
  const [order, setOrder] = useState<Order | null>(null)
  const [shippingAddress, setShippingAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) {
      router.push('/cart')
      return
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price_at_purchase,
            products (
              name
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error || !data) {
        router.push('/cart')
        return
      }

      setOrder(data)
      setShippingAddress(data.shipping_address || '')
      setPhone(data.phone || '')
      setNotes(data.notes || '')
    }

    fetchOrder()
  }, [orderId, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!order) return

    try {
      // Validate minimum 5 cartons per item before submit
      const invalidItem = order.order_items.find((item) => item.quantity < 5)
      if (invalidItem) {
        setError('Minimal order adalah 5 karton per produk. Mohon sesuaikan jumlah di keranjang sebelum checkout.')
        setLoading(false)
        return
      }

      // Update order with shipping details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          shipping_address: shippingAddress,
          phone: phone,
          notes: notes,
        })
        .eq('id', order.id)

      if (updateError) {
        setError('Gagal menyimpan data pengiriman')
        return
      }

      // Redirect to payment page
      router.push(`/customer-orders/${order.id}`)
    } catch {
      setError('Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">
            Memuat...
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/cart" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Keranjang
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Shipping Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Data Pengiriman
              </CardTitle>
              <CardDescription>
                Lengkapi data pengiriman untuk pesanan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Alamat Lengkap</Label>
                  <Input
                    id="shippingAddress"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Masukkan alamat lengkap pengiriman"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan khusus untuk pesanan"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Lanjut ke Pembayaran'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.products.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} karton x {formatCurrency(item.price_at_purchase)} per karton
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.price_at_purchase * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informasi Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Transfer Bank Manual
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  Silakan transfer ke rekening berikut:
                </p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Bank:</strong> BCA</p>
                  <p><strong>No. Rekening:</strong> 1234567890</p>
                  <p><strong>Atas Nama:</strong> Susu Baroka</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  Catatan Penting
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Upload bukti transfer setelah melakukan pembayaran</li>
                  <li>• Pesanan akan diproses setelah pembayaran diverifikasi</li>
                  <li>• Estimasi pengiriman 2-3 hari kerja</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
