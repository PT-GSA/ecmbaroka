'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, getTierPriceForQty } from '@/lib/utils'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[]
    setCartItems(cart)

    // Backfill missing image_url from products table if needed
    const backfillImages = async () => {
      try {
        const missing = cart.filter((c) => !c.image_url)
        if (missing.length === 0) return

        const ids = missing.map((m) => m.productId)
        const { data, error } = await supabase
          .from('products')
          .select('id, image_url')
          .in('id', ids)

        if (error) {
          console.error('Gagal mengambil gambar produk:', error)
          return
        }

        const imageMap = new Map<string, string | null>()
        for (const row of data || []) {
          imageMap.set(row.id as string, (row.image_url as string | null) ?? null)
        }

        const updated = cart.map((item) =>
          item.image_url ? item : { ...item, image_url: imageMap.get(item.productId) ?? null }
        )
        setCartItems(updated)
        localStorage.setItem('cart', JSON.stringify(updated))
      } catch (e) {
        console.error('Backfill image_url error:', e)
      }
    }

    backfillImages()
  }, [supabase])

  const updateQuantity = (productId: string, newQuantity: number) => {
    // Enforce minimum 5 cartons per item
    const clamped = Math.max(5, newQuantity)

    if (clamped <= 0) {
      removeItem(productId)
      return
    }

    const updatedCart = cartItems.map(item => {
      if (item.productId === productId) {
        const newPricePerCarton = getTierPriceForQty(clamped)
        return { ...item, quantity: clamped, price: newPricePerCarton }
      }
      return item
    })
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.productId !== productId)
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
  }

  const totalAmount = cartItems.reduce((total, item) => total + (getTierPriceForQty(item.quantity) * item.quantity), 0)

  const handleCheckout = async () => {
    setLoading(true)
    setError('')

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Validate cart items meet minimum 5 cartons
      const hasInvalidItem = cartItems.some(item => item.quantity < 5)
      if (hasInvalidItem) {
        setError('Minimal order adalah 5 karton per produk. Mohon sesuaikan kuantitas.')
        setLoading(false)
        return
      }

      // Read affiliate cookies (set via /api/affiliate/track)
      let affiliateId: string | null = null
      try {
        // Next.js app router client: read document.cookie in client component
        const cookieStr = typeof document !== 'undefined' ? document.cookie : ''
        const cookiesObj = Object.fromEntries(
          cookieStr
            .split(';')
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const [k, ...rest] = c.split('=')
              return [decodeURIComponent(k), decodeURIComponent(rest.join('='))]
            })
        ) as Record<string, string>
        affiliateId = cookiesObj['afid'] ?? null
      } catch {}

      // Create order without returning representation to avoid RLS SELECT recursion
      const orderId = crypto.randomUUID()
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          user_id: user.id,
          total_amount: totalAmount,
          status: 'pending',
          shipping_address: '-', // Will be filled in checkout
          phone: '-', // Will be filled in checkout
          affiliate_id: affiliateId ?? undefined,
        })

      if (orderError) {
        console.error('Error creating order:', orderError)
        return
      }

      // Add order items
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: getTierPriceForQty(item.quantity),
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error adding order items:', itemsError)
        return
      }

      // Clear cart
      clearCart()

      // Redirect to checkout
      router.push(`/checkout?orderId=${orderId}`)
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-600 mb-4">
            Keranjang Kosong
          </h1>
          <p className="text-gray-500 mb-6">
            Belum ada produk di keranjang Anda
          </p>
          <Button asChild>
            <Link href="/products">
              Mulai Belanja
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/products" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Keranjang Belanja
          </h1>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          
          {cartItems.map((item) => (
            <Card key={item.productId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.price)} per karton
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 10}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity} karton</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Lanjut ke Checkout'}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/products">
                    Lanjut Belanja
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
