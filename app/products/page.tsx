import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/customer/product-card'
import CustomerNavbar from '@/components/customer/navbar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Megaphone } from 'lucide-react'
import Image from 'next/image'
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

export default async function ProductsPage() {
  const supabase = await createClient()
  
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const products = data as Product[]

      if (error) {
        console.error('Products fetch error:', error)
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <CustomerNavbar />
            
            {/* Error Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                  Terjadi Kesalahan
                </h1>
                <p className="text-gray-600 mb-4">
                  Gagal memuat daftar produk. Silakan coba lagi nanti.
                </p>
                <p className="text-sm text-gray-500">
                  Error: {error.message}
                </p>
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

      console.log('Products loaded:', products?.length || 0)

    return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CustomerNavbar />
      {/* JSON-LD ItemList for product listing */}
      {(() => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        const items = (products ?? []).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${appUrl}/products/${p.id}`,
          name: p.name,
        }))
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: items,
        }
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )
      })()}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner global order */}
        <div className="mb-6">
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
            <Megaphone className="h-4 w-4" />
            <AlertDescription>Order minimal 5 karton per produk</AlertDescription>
          </Alert>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Produk Susu Baroka
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Pilih Susu Steril berkualitas tinggi untuk keluarga Anda
          </p>
          <Badge variant="outline" className="text-sm">
            {products?.length || 0} produk tersedia
          </Badge>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Belum Ada Produk
            </h2>
            <p className="text-gray-500">
              Produk sedang dalam persiapan. Silakan kembali lagi nanti.
            </p>
          </div>
        )}
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

  } catch (error) {
    console.error('Products page error:', error)
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <CustomerNavbar />
        
        {/* Error Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Terjadi Kesalahan
            </h1>
            <p className="text-gray-600 mb-4">
              Gagal memuat halaman produk. Silakan coba lagi nanti.
            </p>
            <p className="text-sm text-gray-500">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
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
}

export const metadata: Metadata = {
  title: 'Produk Susu Steril Impor | Susu Baroka',
  description: 'Jelajahi dan beli Susu Steril Impor berkualitas tinggi dari Susu Baroka.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Produk Susu Steril Impor | Susu Baroka',
    description: 'Jelajahi dan beli Susu Steril Impor berkualitas tinggi dari Susu Baroka.',
    url: '/products',
    type: 'website',
    images: [{ url: '/original.jpeg', width: 1200, height: 630, alt: 'Produk Susu Steril Impor' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Produk Susu Steril Impor | Susu Baroka',
    description: 'Jelajahi dan beli Susu Steril Impor berkualitas tinggi dari Susu Baroka.',
    images: ['/original.jpeg'],
  },
}