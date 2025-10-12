'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

interface ProductPreorderFormProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
  }
}

export default function ProductPreorderForm({ product }: ProductPreorderFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const totalPrice = product.price * quantity

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

      // Get existing cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      
      // Check if product already exists in cart
      const existingItemIndex = existingCart.findIndex((item: { productId: string }) => item.productId === product.id)
      
      if (existingItemIndex >= 0) {
        // Update quantity if product exists
        existingCart[existingItemIndex].quantity += quantity
      } else {
        // Add new item to cart
        existingCart.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image_url: null // Will be fetched later
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

      // Create order directly
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
          status: 'pending',
          shipping_address: '', // Will be filled in checkout
          phone: '', // Will be filled in checkout
        })
        .select()
        .single()

      if (orderError) {
        setError('Gagal membuat pesanan')
        return
      }

      // Add order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: quantity,
          price_at_purchase: product.price,
        })

      if (itemError) {
        setError('Gagal menambahkan item pesanan')
        return
      }

      // Redirect to checkout
      router.push(`/checkout?orderId=${order.id}`)
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
          Preorder Sekarang
        </CardTitle>
        <CardDescription>
          Pilih jumlah dan lanjutkan ke pembayaran
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
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
              min={1}
              max={product.stock}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">
              dari {product.stock} tersedia
            </span>
          </div>
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Harga per unit:</span>
            <span>{formatCurrency(product.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Jumlah:</span>
            <span>{quantity} unit</span>
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
            className="w-full" 
            onClick={handleBuyNow}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Beli Sekarang'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={loading}
          >
            Tambah ke Keranjang
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
