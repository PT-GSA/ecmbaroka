import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    stock: number
    is_active: boolean
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          {!product.is_active && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Tidak Tersedia
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">
          {product.name}
        </CardTitle>
        {product.description && (
          <CardDescription className="mb-3 line-clamp-2">
            {product.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          <Badge variant="outline">
            Stok: {product.stock}
          </Badge>
        </div>
        <Button 
          className="w-full" 
          disabled={!product.is_active || product.stock === 0}
          asChild
        >
          <Link href={`/customer-products/${product.id}`}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {!product.is_active || product.stock === 0 ? 'Tidak Tersedia' : 'Preorder'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
