import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Package, Save } from 'lucide-react'
import ProductMediaManager from '@/components/admin/product-media-manager'
import CoverSync from '@/components/admin/cover-sync'
import { Trash2 } from 'lucide-react'
import ProductUpdateSuccessDialog from '@/components/admin/product-update-success-dialog'
import { Database } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ success?: string }>
}

export default async function AdminProductDetailPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const { id } = await params
  const sp = searchParams ? await searchParams : undefined
  const showSuccess = sp?.success === '1'

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin-auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null

  if (!typedProfile || typedProfile.role !== 'admin') {
    redirect('/')
  }

  // Fetch product by id
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  const product = data as Database['public']['Tables']['products']['Row'] | null

  if (error || !product) {
    notFound()
  }

  // List product images from Supabase storage and build gallery URLs
  const { data: storageItems } = await supabase.storage
    .from('products')
    .list(product.id, { limit: 100 })

  const galleryUrls: string[] = (storageItems
    ?.filter((item) => /\.(png|jpg|jpeg|webp|gif)$/i.test(item.name))
    .map((item) =>
      supabase.storage
        .from('products')
        .getPublicUrl(`${product.id}/${item.name}`).data.publicUrl
    )) ?? []

  if (galleryUrls.length === 0 && product.image_url) {
    galleryUrls.push(product.image_url)
  }

  const productSpecs = (product.specs ?? {}) as Record<string, unknown>
  const getSpecDefault = (k: string) => {
    const v = productSpecs[k]
    if (v === undefined || v === null) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Modern Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" asChild className="hover:bg-blue-100">
                    <Link href="/admin/products" className="flex items-center">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali ke Produk
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Edit Produk
                    </h1>
                    <p className="text-gray-600 text-lg">{product.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={product.is_active ? 'default' : 'destructive'} className="px-4 py-2 text-sm font-medium">
                  {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
                <form action={async () => {
                  'use server'
                  const supa: SupabaseClient<Database> = await createClient()
                  const { error: delError } = await supa
                    .from('products')
                    .delete()
                    .eq('id', id)
                  if (delError) {
                    throw new Error(delError.message)
                  }
                  redirect('/admin/products')
                }}>
                  <Button type="submit" variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Produk
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Popup sukses update */}
        <ProductUpdateSuccessDialog show={showSuccess} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Gallery */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Galeri Produk</h3>
                  <p className="text-sm text-gray-600">Gambar dan media produk</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 hover:shadow-md transition-shadow">
                      <Image
                        src={url}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
                  <div className="text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada gambar</p>
                  </div>
                </div>
              )}
              
              {/* Product Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">SKU</p>
                    <p className="text-sm text-gray-600">{product.sku ?? '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dibuat</p>
                    <p className="text-sm text-gray-600">{formatDate(product.created_at)}</p>
                  </div>
                </div>
                
                {product.updated_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Diperbarui</p>
                      <p className="text-sm text-gray-600">{formatDate(product.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Management */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Media Produk</h3>
                    <p className="text-sm text-gray-600">Kelola gambar dan media produk</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <ProductMediaManager productId={product.id} />
                <CoverSync productId={product.id} initialCoverUrl={product.image_url ?? null} />
              </div>
            </div>

            {/* Product Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Produk</h3>
                    <p className="text-sm text-gray-600">Edit detail produk</p>
                  </div>
                </div>
              </div>
              
              <form className="p-6 space-y-6" action={async (formData: FormData) => {
              'use server'
              const supa: SupabaseClient<Database> = await createClient()
              const name = String(formData.get('name') ?? '')
              const description = String(formData.get('description') ?? '')
              const price = Number(formData.get('price') ?? product.price)
              const stock = Number(formData.get('stock') ?? product.stock)
              const image_url_input = String(formData.get('image_url') ?? '').trim()
              const original_image_url = String(formData.get('original_image_url') ?? '').trim()
              const is_active = formData.get('is_active') === 'on'

              // Build specs JSON from form fields, preserving existing values when input is empty
              const specKeys = [
                'stock_status',
                'brand',
                'storage_condition',
                'flavor',
                'origin_country',
                'shelf_life',
                'diet_menu',
                'qty_per_pack',
                'custom_product',
                'expiry_date',
                'volume',
                'units_per_pack',
                'halal_cert_no',
                'shipped_from',
              ] as const
              const existingSpecs = (product.specs ?? {}) as Record<string, unknown>
              const specs: Record<string, unknown> = {}
              for (const key of specKeys) {
                const raw = formData.get(key)
                const val = raw ? String(raw).trim() : ''
                const existing = existingSpecs[key]
                if (val) {
                  specs[key] = val
                } else if (
                  typeof existing === 'string' ||
                  typeof existing === 'number' ||
                  typeof existing === 'boolean'
                ) {
                  specs[key] = String(existing)
                }
              }

              const updateData: Database['public']['Tables']['products']['Update'] = {
                name,
                description,
                price,
                stock,
                is_active,
                specs,
              }

              if (image_url_input !== original_image_url) {
                updateData.image_url = image_url_input ? image_url_input : null
              }

              const productsUpdateBuilder = supa.from('products') as unknown as {
                update: (payload: Database['public']['Tables']['products']['Update']) => {
                  eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>
                }
              }
              const { error: updateError } = await productsUpdateBuilder
                .update(updateData)
                .eq('id', id)

              if (updateError) {
                throw new Error(updateError.message)
              }
              const path = `/admin/products/${id}`
              // Revalidate halaman detail produk dan daftar produk agar stok terbaru tampil
              revalidatePath(path)
              revalidatePath('/admin/products')
              redirect(`${path}?success=1`)
            }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nama Produk</Label>
                    <Input id="name" name="name" defaultValue={product.name} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">Harga</Label>
                    <Input id="price" name="price" type="number" step="1" defaultValue={product.price} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700">Stok</Label>
                    <Input id="stock" name="stock" type="number" step="1" defaultValue={product.stock} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <details className="group">
                      <summary className="cursor-pointer select-none text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                        Pengaturan Lanjutan: URL Gambar
                      </summary>
                      <div className="mt-4 space-y-3">
                        <Label htmlFor="image_url" className="text-sm font-medium text-gray-700">URL Gambar</Label>
                        <Input id="image_url" name="image_url" defaultValue={product.image_url ?? ''} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                        <input type="hidden" name="original_image_url" value={product.image_url ?? ''} />
                      </div>
                    </details>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi</Label>
                    <textarea
                      id="description"
                      name="description"
                      defaultValue={product.description ?? ''}
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                      placeholder="Masukkan deskripsi produk..."
                    />
                  </div>
                  <div className="flex items-center gap-3 md:col-span-2 p-4 bg-gray-50 rounded-lg">
                    <input 
                      id="is_active" 
                      name="is_active" 
                      type="checkbox" 
                      defaultChecked={product.is_active}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">Produk Aktif</Label>
                  </div>
                </div>

                {/* Specifications Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Spesifikasi Produk</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="stock_status" className="text-sm font-medium text-gray-700">Status Stok</Label>
                      <Input id="stock_status" name="stock_status" placeholder="TERSEDIA" defaultValue={getSpecDefault('stock_status')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="brand" className="text-sm font-medium text-gray-700">Merek</Label>
                      <Input id="brand" name="brand" placeholder="Baroka" defaultValue={getSpecDefault('brand')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="storage_condition" className="text-sm font-medium text-gray-700">Kondisi Penyimpanan</Label>
                      <Input id="storage_condition" name="storage_condition" placeholder="Suhu Ruangan" defaultValue={getSpecDefault('storage_condition')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="flavor" className="text-sm font-medium text-gray-700">Rasa</Label>
                      <Input id="flavor" name="flavor" placeholder="Mawar" defaultValue={getSpecDefault('flavor')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="origin_country" className="text-sm font-medium text-gray-700">Negara Asal</Label>
                      <Input id="origin_country" name="origin_country" placeholder="Indonesia" defaultValue={getSpecDefault('origin_country')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="shelf_life" className="text-sm font-medium text-gray-700">Masa Penyimpanan</Label>
                      <Input id="shelf_life" name="shelf_life" placeholder="12 Bulan" defaultValue={getSpecDefault('shelf_life')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="diet_menu" className="text-sm font-medium text-gray-700">Menu Makanan Khusus</Label>
                      <Input id="diet_menu" name="diet_menu" placeholder="Halal, Menu Sehat" defaultValue={getSpecDefault('diet_menu')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="qty_per_pack" className="text-sm font-medium text-gray-700">Quantity per Pack</Label>
                      <Input id="qty_per_pack" name="qty_per_pack" placeholder="1" defaultValue={getSpecDefault('qty_per_pack')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="custom_product" className="text-sm font-medium text-gray-700">Produk Custom</Label>
                      <Input id="custom_product" name="custom_product" placeholder="Tidak" defaultValue={getSpecDefault('custom_product')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="expiry_date" className="text-sm font-medium text-gray-700">Tanggal Kedaluwarsa</Label>
                      <Input id="expiry_date" name="expiry_date" placeholder="20-02-2026" defaultValue={getSpecDefault('expiry_date')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="volume" className="text-sm font-medium text-gray-700">Volume</Label>
                      <Input id="volume" name="volume" placeholder="180ml" defaultValue={getSpecDefault('volume')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="units_per_pack" className="text-sm font-medium text-gray-700">Jumlah Produk Dalam Kemasan</Label>
                      <Input id="units_per_pack" name="units_per_pack" placeholder="24" defaultValue={getSpecDefault('units_per_pack')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="halal_cert_no" className="text-sm font-medium text-gray-700">No. Sertifikasi (Halal)</Label>
                      <Input id="halal_cert_no" name="halal_cert_no" placeholder="-" defaultValue={getSpecDefault('halal_cert_no')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="shipped_from" className="text-sm font-medium text-gray-700">Dikirim Dari</Label>
                      <Input id="shipped_from" name="shipped_from" placeholder="KOTA BEKASI" defaultValue={getSpecDefault('shipped_from')} className="h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12 px-8">
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          </div>

        {/* Product Specifications Display */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Spesifikasi Produk</h3>
                  <p className="text-sm text-gray-600">Detail spesifikasi produk saat ini</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {(() => {
                const specs = (product.specs ?? {}) as Record<string, unknown>
                const get = (k: string, d: string) => {
                  const v = specs[k]
                  if (v === undefined || v === null) return d
                  if (typeof v === 'string') return v || d
                  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
                  return d
                }
                const items = [
                  { label: 'Status Stok', value: get('stock_status', 'TERSEDIA') },
                  { label: 'Merek', value: get('brand', 'Baroka') },
                  { label: 'Kondisi Penyimpanan', value: get('storage_condition', 'Suhu Ruangan') },
                  { label: 'Rasa', value: get('flavor', 'Mawar') },
                  { label: 'Negara Asal', value: get('origin_country', 'Indonesia') },
                  { label: 'Masa Penyimpanan', value: get('shelf_life', '12 Bulan') },
                  { label: 'Menu Makanan Khusus', value: get('diet_menu', 'Halal, Menu Sehat') },
                  { label: 'Quantity per Pack', value: get('qty_per_pack', '1') },
                  { label: 'Produk Custom', value: get('custom_product', 'Tidak') },
                  { label: 'Tanggal Kedaluwarsa', value: get('expiry_date', '20-02-2026') },
                  { label: 'Volume', value: get('volume', '180ml') },
                  { label: 'Jumlah Produk Dalam Kemasan', value: get('units_per_pack', '24') },
                  { label: 'No. Sertifikasi (Halal)', value: get('halal_cert_no', '-') },
                  { label: 'Dikirim Dari', value: get('shipped_from', 'KOTA BEKASI'), fullRow: true },
                ]
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors ${item.fullRow ? 'md:col-span-2' : ''}`}
                      >
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
