'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, getTierPriceForQty } from '@/lib/utils'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

interface ProductPreorderFormProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    image_url?: string | null
  }
}

export default function ProductPreorderForm({ product }: ProductPreorderFormProps) {
  const [quantity, setQuantity] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const perCartonPrice = getTierPriceForQty(quantity)
  const baseCartonPrice = getTierPriceForQty(5)
  const totalPrice = perCartonPrice * quantity
  const isDiscounted = quantity >= 10 && perCartonPrice < baseCartonPrice
  const discountPct = isDiscounted ? Math.round(((baseCartonPrice - perCartonPrice) / baseCartonPrice) * 100) : 0

  const handleAddToCart = async () => {
    setLoading(true)
    setError('')

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Enforce minimum 5 cartons
      if (quantity < 5) {
        setError('Minimal order adalah 5 karton per produk')
        return
      }

      // Get existing cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      
      // Check if product already exists in cart
      const existingItemIndex = existingCart.findIndex((item: { productId: string }) => item.productId === product.id)
      
      if (existingItemIndex >= 0) {
        // Update quantity if product exists and recalculates tier price based on new total quantity
        const newQty = existingCart[existingItemIndex].quantity + quantity
        existingCart[existingItemIndex].quantity = newQty
        existingCart[existingItemIndex].price = getTierPriceForQty(newQty)
      } else {
        // Add new item to cart
        existingCart.push({
          productId: product.id,
          name: product.name,
          price: perCartonPrice,
          quantity: quantity,
          image_url: product.image_url ?? null
        })
      }
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart))
      
      // Redirect to cart
      router.push('/cart')
    } catch {
      setError('Gagal menambahkan ke keranjang')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async () => {
    setLoading(true)
    setError('')

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Enforce minimum 5 cartons
      if (quantity < 5) {
        setError('Minimal order adalah 5 karton per produk')
        return
      }

      // Try to prefill shipping info from user profile
      let phonePrefill = ''
      let addressPrefill = ''
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('phone, address')
          .eq('id', user.id)
          .maybeSingle()
        phonePrefill = (profile?.phone ?? '').trim()
        addressPrefill = (profile?.address ?? '').trim()
      } catch {}
      // Create order via server endpoint to generate structured order_code
      const payload = {
        items: [{ product_id: product.id, quantity, price_at_purchase: perCartonPrice }],
        shipping_address: addressPrefill || '-',
        phone: phonePrefill || '-',
      }

      const res = await fetch('/api/customer/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        console.error('Gagal membuat pesanan:', j?.error || res.statusText)
        setError(j?.error || 'Gagal membuat pesanan')
        return
      }

      const { orderId } = await res.json()

      // Redirect to checkout
      router.push(`/checkout?orderId=${orderId}`)
    } catch {
      setError('Terjadi kesalahan saat membuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Sekarang
        </CardTitle>
        <CardDescription>
          Website khusus order. Minimal 5 karton per produk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantity Selector */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Jumlah</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(5, quantity - 1))}
              disabled={quantity <= 5}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                const parsed = parseInt(e.target.value || '0', 10)
                setQuantity(Number.isNaN(parsed) ? 0 : parsed)
              }}
              onBlur={() => {
                if (quantity < 5) setQuantity(5)
              }}
              min={5}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            {/* Stock availability text removed per request */}
            
          </div>
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm items-center">
            <span>Harga per karton:</span>
            {isDiscounted ? (
              <div className="flex items-center gap-2">
                <span className="line-through text-gray-500">{formatCurrency(baseCartonPrice)}</span>
                <span className="font-semibold text-primary">{formatCurrency(perCartonPrice)}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Diskon {discountPct}%</span>
              </div>
            ) : (
              <span>{formatCurrency(perCartonPrice)}</span>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span>Jumlah:</span>
            <span>{quantity} karton</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full hover:bg-red-500 hover:text-white" 
            onClick={handleAddToCart}
            disabled={loading}
          >
            Tambah ke Keranjang
          </Button>
          <Button 
            className="w-full hover:bg-red-500 hover:text-white" 
            onClick={handleBuyNow}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Beli Sekarang'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
