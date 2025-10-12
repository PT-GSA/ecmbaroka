import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Package, Plus, Edit, Eye } from 'lucide-react'
import BulkDeleteDialog from '@/components/admin/bulk-delete-dialog'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-600">
          Gagal memuat daftar produk. Silakan coba lagi nanti.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-gray-600">Mengelola katalog produk susu Baroka</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {products && products.length > 0 ? (
        <form id="bulk-delete-form"
          action={async (formData) => {
            'use server'
            const supa = await createClient()
            const { data: { user } } = await supa.auth.getUser()
            if (!user) {
              redirect('/admin-auth/login')
            }
            const { data: profile } = await supa
              .from('user_profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            if (!profile || profile.role !== 'admin') {
              redirect('/')
            }

            const ids = formData.getAll('ids').map(String)
            if (ids.length > 0) {
              const { error: delErr } = await supa
                .from('products')
                .delete()
                .in('id', ids)
              if (delErr) {
                throw new Error(delErr.message)
              }
            }
            redirect('/admin/products')
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Pilih produk lalu klik &quot;Hapus Terpilih&quot;</p>
            <BulkDeleteDialog formId="bulk-delete-form" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-white">
                    {/* Checkbox untuk memilih produk */}
                    <div className="absolute top-2 left-2 z-10 bg-white/80 backdrop-blur rounded-md px-2 py-1 shadow">
                      <input
                        type="checkbox"
                        name="ids"
                        value={product.id}
                        className="h-4 w-4 align-middle"
                        aria-label={`Pilih ${product.name}`}
                      />
                    </div>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={product.is_active ? 'success' : 'destructive'}>
                        {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-base line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      <Badge variant="outline">
                        Stok: {product.stock}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Dibuat: {formatDate(product.created_at)}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/products/${product.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/products/${product.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </form>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Belum Ada Produk
            </h2>
            <p className="text-gray-500 mb-6">
              Mulai dengan menambahkan produk pertama Anda
            </p>
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Produk Pertama
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
