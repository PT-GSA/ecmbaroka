import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, getTierPriceForQty } from '@/lib/utils'
import { ArrowLeft, ShoppingCart, Package, Truck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ProductPreorderForm from '@/components/customer/product-preorder-form'
import ProductCard from '@/components/customer/product-card'
import CustomerNavbar from '@/components/customer/navbar'
import ProductMediaGallery from '@/components/customer/product-media-gallery'
import ProductRatingSummary from '@/components/customer/product-rating-summary'
import ProductReviewForm from '@/components/customer/product-review-form'
import ProductReviewsList from '@/components/customer/product-reviews-list'
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

// Render deskripsi sebagai paragraf dan bullet list jika ada tanda '-'/'•'/'*'
function renderDescriptionContent(desc: string) {
  // Split into blocks by blank lines, keep original order
  const lines = desc.split('\n')
  const blocks: string[][] = []
  let buf: string[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) {
      if (buf.length) {
        blocks.push(buf)
        buf = []
      }
      continue
    }
    buf.push(line)
  }
  if (buf.length) blocks.push(buf)

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const first = block[0]
        const rest = block.slice(1)
        const isSection = first.endsWith(':')
        if (isSection) {
          return (
            <div key={i}>
              <p className="font-semibold text-gray-900 leading-relaxed mb-2">{first}</p>
              {rest.length > 0 && (
                <div className="space-y-2">
                  {rest.map((t, j) => (
                    <p key={j} className="text-gray-700 leading-relaxed">{t}</p>
                  ))}
                </div>
              )}
            </div>
          )
        }
        return (
          <div key={i} className="space-y-2">
            {block.map((t, j) => (
              <p key={j} className="text-gray-700 leading-relaxed">{t}</p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const product = data as Product

  // List product media (images/videos) from Supabase storage and build gallery URLs
  const { data: storageItems } = await supabase.storage
    .from('products')
    .list(product.id, { limit: 100 })

  const storageItemsTyped = storageItems as { name: string }[]

  const imageUrls: string[] = (storageItemsTyped
    ?.filter((item) => /\.(png|jpg|jpeg|webp|gif)$/i.test(item.name))
    .map((item) =>
      supabase.storage
        .from('products')
        .getPublicUrl(`${product.id}/${item.name}`).data.publicUrl
    )) ?? []

  const videoUrls: string[] = (storageItemsTyped
    ?.filter((item) => /\.(mp4|webm|mov|m4v)$/i.test(item.name))
    .map((item) =>
      supabase.storage
        .from('products')
        .getPublicUrl(`${product.id}/${item.name}`).data.publicUrl
    )) ?? []

  const galleryUrls: string[] = imageUrls

  if (galleryUrls.length === 0 && product.image_url) {
    galleryUrls.push(product.image_url)
  }

  // Siapkan data deskripsi untuk preview/collapse
  const desc = (product.description ?? '').trim()
  const descLines = desc ? desc.split('\n').map((l: string) => l.trim()).filter(Boolean) : []
  const isLongDesc = descLines.length > 8
  const previewDesc = descLines.slice(0, 8).join('\n')

  // Fetch product reviews
  const { data: reviewsData } = await supabase
    .from('product_reviews')
    .select(`
      id,
      rating,
      comment,
      verified_purchase,
      created_at,
      user_id
    `)
    .eq('product_id', id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  const reviews = reviewsData as Database['public']['Tables']['product_reviews']['Row'][]

  // Fetch user profiles separately
  const userIds = reviews?.map(r => r.user_id) || []

  const { data: userProfiles } = userIds.length > 0 ? await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', userIds) : { data: [] }

  const userProfilesTyped = userProfiles as Database['public']['Tables']['user_profiles']['Row'][]

  // Combine reviews with user profiles
  const reviewsWithUsers = reviews?.map(review => ({
    ...review,
    user_profiles: userProfilesTyped?.find(profile => profile.id === review.user_id) || null
  })) || []



  // Check if current user already reviewed this product
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userReviewData } = user ? await supabase
    .from('product_reviews')
    .select('id')
    .eq('product_id', id)
    .eq('user_id', user.id)
    .single() : { data: null }

  const userReview = userReviewData as Database['public']['Tables']['product_reviews']['Row'] | null

  // Calculate rating distribution
  const ratingDistribution = {
    5: reviewsWithUsers?.filter(r => r.rating === 5).length || 0,
    4: reviewsWithUsers?.filter(r => r.rating === 4).length || 0,
    3: reviewsWithUsers?.filter(r => r.rating === 3).length || 0,
    2: reviewsWithUsers?.filter(r => r.rating === 2).length || 0,
    1: reviewsWithUsers?.filter(r => r.rating === 1).length || 0,
  }

  // Related products: other active products excluding current
  const { data: relatedProductsData } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .neq('id', product.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const relatedProducts = relatedProductsData as Product[]

  return (
    <div>
      <CustomerNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
          <ol className="list-reset flex items-center gap-2">
            <li>
              <Link href="/" className="hover:underline">Beranda</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/products" className="hover:underline">Produk</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="font-medium text-gray-900">{product.name}</li>
          </ol>
        </nav>
      </div>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/products" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images Gallery */}
        <div className="space-y-4">
          {galleryUrls.length > 0 || videoUrls.length > 0 ? (
            <ProductMediaGallery
              items={[
                ...galleryUrls.map((url) => ({ type: 'image' as const, url })),
                ...videoUrls.map((url) => ({ type: 'video' as const, url })),
              ]}
              alt={product.name}
            />
          ) : (
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
          )}

          {desc && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 font-semibold text-gray-900">Deskripsi Produk</div>
              <div className="p-4">
                {renderDescriptionContent(previewDesc)}
                {isLongDesc && (
                  <details className="mt-2">
                    <summary className="cursor-pointer select-none text-sm text-primary hover:underline">Baca selengkapnya</summary>
                    <div className="pt-3">
                      {renderDescriptionContent(desc)}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(getTierPriceForQty(5))}
              </span>
              <Badge variant="outline">
                Preorder hanya, harga per karton (harga 5 karton ditampilkan)
              </Badge>
            </div>
            {/* Alert preorder per produk */}
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
              <AlertDescription>
                Khusus preorder: minimal 5 karton per produk.
              </AlertDescription>
            </Alert>
            {/* Deskripsi dipindahkan ke bawah gallery untuk tampilan lebih rapi */}
          </div>

          <Separator />

          {/* Product Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Keunggulan Produk</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-sm">Susu Steril Impor</span>
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

          {/* Preorder Form: always available if product is active */}
          {product.is_active ? (
            <ProductPreorderForm product={product} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Produk Tidak Aktif
                </h3>
                <p className="text-gray-500">
                  Produk sedang tidak aktif.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rating & Reviews Section */}
      <div className="mt-12 space-y-8">
        {/* Rating Summary */}
        <ProductRatingSummary
          averageRating={product.average_rating || 4.9}
          totalReviews={product.total_reviews || reviewsWithUsers?.length || 0}
          ratingDistribution={ratingDistribution}
        />

        {/* Review Form - Show if user is logged in and hasn't reviewed */}
        {user && !userReview && (
          <ProductReviewForm
            productId={product.id}
            productName={product.name}
          />
        )}


        {/* Reviews List */}
        <ProductReviewsList
          reviews={reviewsWithUsers}
        />
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Produk Terkait</h2>
        {relatedProducts && relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">
              Tidak ada produk terkait.
            </CardContent>
          </Card>
        )}
      </div>
      </div>

      {/* Footer minimal */}
      <footer className="border-t border-neutral-200 py-10 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Susu Baroka" width={140} height={32} />
            </div>
            <div className="text-neutral-600">&copy; 2025 Susu Baroka. Semua hak dilindungi.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// SEO Metadata per produk
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { id } = await params
  const { data: productData } = await supabase
    .from('products')
    .select('name, description, image_url')
    .eq('id', id)
    .single()

  const product = productData as Product | null

  const title = product ? `${product.name} | Susu Baroka` : 'Produk | Susu Baroka'
  const description = product?.description ?? 'Produk susu Baroka.'
  const images = product?.image_url ? [product.image_url] : []

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: `/products/${id}`,
    },
  }
}
