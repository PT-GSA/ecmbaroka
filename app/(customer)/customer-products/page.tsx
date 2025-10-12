import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/customer/product-card'
import { Badge } from '@/components/ui/badge'

export default async function ProductsPage() {
  const supabase = await createClient()
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Products fetch error:', error)
      return (
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
      )
    }

    console.log('Products loaded:', products?.length || 0)

    return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Produk Susu Baroka
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Pilih susu segar berkualitas tinggi untuk keluarga Anda
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
  )

  } catch (error) {
    console.error('Products page error:', error)
    return (
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
    )
  }
}
