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
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Package,
  CreditCard,
  Truck,
  Shield,
  Sparkles
} from 'lucide-react'

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

      // Create order via server endpoint to generate structured order_code
      const payload = {
        items: cartItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price_at_purchase: getTierPriceForQty(item.quantity),
        })),
      }

      const res = await fetch('/api/customer/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        console.error('Error creating order:', j?.error || res.statusText)
        setError(j?.error || 'Gagal membuat pesanan')
        setLoading(false)
        return
      }

      const { orderId } = await res.json()

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link href="/products" className="flex items-center text-slate-600 hover:text-slate-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Produk
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Keranjang Belanja</h1>
            <p className="text-slate-600">Kelola produk yang ingin Anda beli</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-blue-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Keranjang Anda Kosong
            </h2>
            <p className="text-slate-600 text-center max-w-md mb-8">
              Mulai jelajahi produk berkualitas tinggi kami dan tambahkan ke keranjang untuk memulai belanja
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Link href="/products" className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Mulai Belanja
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/products" className="flex items-center">
                  Lihat Produk Terbaru
                </Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Pengiriman Cepat</h3>
              <p className="text-sm text-slate-600">Dapatkan produk Anda dalam 1-2 hari kerja</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Garansi Produk</h3>
              <p className="text-sm text-slate-600">100% produk asli dengan garansi resmi</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Pembayaran Aman</h3>
              <p className="text-sm text-slate-600">Berbagai metode pembayaran yang aman</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/products" className="flex items-center text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Produk
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Keranjang Belanja</h1>
              <p className="text-slate-600">{cartItems.length} produk di keranjang Anda</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <Package className="h-4 w-4" />
              <span>Minimal 5 karton per produk</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}
            
            {cartItems.map((item) => (
              <Card key={item.productId} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Product Image */}
                    <div className="sm:w-32 sm:h-32 w-full h-48 relative bg-gradient-to-br from-slate-100 to-slate-200">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      {item.quantity >= 10 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Diskon
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.name}</h3>
                          
                          {item.quantity >= 10 ? (
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 line-through">
                                  {formatCurrency(getTierPriceForQty(5))}
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                              <div className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                                Hemat {Math.round(((getTierPriceForQty(5) - item.price) / getTierPriceForQty(5)) * 100)}%
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-600 mb-3">
                              {formatCurrency(item.price)} per karton
                            </p>
                          )}
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600 font-medium">Kuantitas:</span>
                            <div className="flex items-center border border-slate-200 rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 5}
                                className="h-8 w-8 rounded-none rounded-l-lg hover:bg-slate-100"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="px-4 py-2 bg-white border-x border-slate-200 min-w-[60px] text-center font-semibold">
                                {item.quantity}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="h-8 w-8 rounded-none rounded-r-lg hover:bg-slate-100"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="text-xs text-slate-500">karton</span>
                          </div>
                        </div>
                        
                        {/* Price & Actions */}
                        <div className="flex flex-col sm:items-end gap-3">
                          <div className="text-right">
                            <p className="text-sm text-slate-500">Subtotal</p>
                            <p className="text-xl font-bold text-slate-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 mb-3">Detail Produk</h4>
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} karton × {formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 ml-2">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Separator className="bg-slate-200" />
                
                {/* Total */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg px-4">
                    <span className="text-lg font-semibold text-slate-900">Total Pesanan</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                  </div>
                  
                  {/* Savings Info */}
                  {cartItems.some(item => item.quantity >= 10) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-green-600 text-xs font-bold">✓</span>
                        </div>
                        <p className="text-sm text-green-800 font-medium">
                          Anda mendapat diskon untuk pembelian 10+ karton!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                    onClick={handleCheckout}
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Memproses...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Lanjut ke Checkout
                      </div>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 py-3 rounded-xl" asChild>
                    <Link href="/products" className="flex items-center justify-center">
                      <Package className="mr-2 h-4 w-4" />
                      Lanjut Belanja
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Indicators */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                        <Truck className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Gratis Ongkir</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">100% Aman</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-1">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Garansi</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
