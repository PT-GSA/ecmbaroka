import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, ShoppingCart, Package, Truck } from 'lucide-react'
import ProductPreorderForm from '@/components/customer/product-preorder-form'

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = createClient()
  
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !product) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/customer-products" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-lg">No Image</span>
              </div>
            )}
            {!product.is_active && (
              <Badge variant="destructive" className="absolute top-4 right-4">
                Tidak Tersedia
              </Badge>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              <Badge variant="outline">
                Stok: {product.stock}
              </Badge>
            </div>
            {product.description && (
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <Separator />

          {/* Product Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Keunggulan Produk</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-sm">Susu segar langsung dari peternakan</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">Pengiriman aman dan terpercaya</span>
              </div>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="text-sm">Sistem preorder yang mudah</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preorder Form */}
          {product.is_active && product.stock > 0 ? (
            <ProductPreorderForm product={product} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Produk Tidak Tersedia
                </h3>
                <p className="text-gray-500">
                  {product.stock === 0 
                    ? 'Stok produk sedang habis' 
                    : 'Produk sedang tidak aktif'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
