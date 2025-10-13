import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Produk</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={product.is_active ? 'success' : 'destructive'}>
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
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </Button>
          </form>
        </div>
      </div>

      {/* Popup sukses update */}
      <ProductUpdateSuccessDialog show={showSuccess} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="p-0">
            <div className="p-2">
              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={url}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-square bg-gray-200 flex items-center justify-center rounded-lg">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-sm text-gray-600">
            <div>SKU: {product.sku ?? '-'}</div>
            <div>Dibuat: {formatDate(product.created_at)}</div>
            <div>Diperbarui: {product.updated_at ? formatDate(product.updated_at) : '-'}</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Media Produk</h2>
              <ProductMediaManager productId={product.id} />
              {/* Preview cover aktif dan sinkronisasi nilai input URL Gambar */}
              <CoverSync productId={product.id} initialCoverUrl={product.image_url ?? null} />
            </div>

            <form className="space-y-6" action={async (formData: FormData) => {
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
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">Nama Produk</Label>
                  <Input id="name" name="name" defaultValue={product.name} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-base">Harga</Label>
                  <Input id="price" name="price" type="number" step="1" defaultValue={product.price} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-base">Stok</Label>
                  <Input id="stock" name="stock" type="number" step="1" defaultValue={product.stock} className="h-12" />
                </div>
                <div className="space-y-2">
                  {/* Kolom URL Gambar disembunyikan secara default, dapat dibuka jika diperlukan */}
                  <details>
                    <summary className="cursor-pointer select-none text-sm text-primary hover:underline">Pengaturan Lanjutan: URL Gambar</summary>
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="image_url" className="text-base">URL Gambar</Label>
                      <Input id="image_url" name="image_url" defaultValue={product.image_url ?? ''} className="h-12" />
                      {/* Hidden field untuk mendeteksi apakah kolom URL Gambar diubah */}
                      <input type="hidden" name="original_image_url" value={product.image_url ?? ''} />
                    </div>
                  </details>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-base">Deskripsi</Label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={product.description ?? ''}
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm h-32 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <input id="is_active" name="is_active" type="checkbox" defaultChecked={product.is_active} />
                  <Label htmlFor="is_active" className="text-base">Aktif</Label>
                </div>
              </div>

              <Separator />

              {/* Edit Spesifikasi */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Edit Spesifikasi Produk</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stock_status" className="text-base">Stok</Label>
                    <Input id="stock_status" name="stock_status" placeholder="TERSEDIA" defaultValue={getSpecDefault('stock_status')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-base">Merek</Label>
                    <Input id="brand" name="brand" placeholder="Baroka" defaultValue={getSpecDefault('brand')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage_condition" className="text-base">Kondisi Penyimpanan</Label>
                    <Input id="storage_condition" name="storage_condition" placeholder="Suhu Ruangan" defaultValue={getSpecDefault('storage_condition')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flavor" className="text-base">Rasa</Label>
                    <Input id="flavor" name="flavor" placeholder="Mawar" defaultValue={getSpecDefault('flavor')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origin_country" className="text-base">Negara Asal</Label>
                    <Input id="origin_country" name="origin_country" placeholder="Indonesia" defaultValue={getSpecDefault('origin_country')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelf_life" className="text-base">Masa Penyimpanan</Label>
                    <Input id="shelf_life" name="shelf_life" placeholder="12 Bulan" defaultValue={getSpecDefault('shelf_life')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diet_menu" className="text-base">Menu Makanan Khusus</Label>
                    <Input id="diet_menu" name="diet_menu" placeholder="Halal, Menu Sehat" defaultValue={getSpecDefault('diet_menu')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qty_per_pack" className="text-base">Quantity per Pack</Label>
                    <Input id="qty_per_pack" name="qty_per_pack" placeholder="1" defaultValue={getSpecDefault('qty_per_pack')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_product" className="text-base">Produk Custom</Label>
                    <Input id="custom_product" name="custom_product" placeholder="Tidak" defaultValue={getSpecDefault('custom_product')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date" className="text-base">Tanggal Kedaluwarsa</Label>
                    <Input id="expiry_date" name="expiry_date" placeholder="20-02-2026" defaultValue={getSpecDefault('expiry_date')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume" className="text-base">Volume</Label>
                    <Input id="volume" name="volume" placeholder="180ml" defaultValue={getSpecDefault('volume')} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="units_per_pack" className="text-base">Jumlah Produk Dalam Kemasan</Label>
                    <Input id="units_per_pack" name="units_per_pack" placeholder="24" defaultValue={getSpecDefault('units_per_pack')} className="h-12" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="halal_cert_no" className="text-base">No. Sertifikasi (Halal)</Label>
                    <Input id="halal_cert_no" name="halal_cert_no" placeholder="-" defaultValue={getSpecDefault('halal_cert_no')} className="h-12" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="shipped_from" className="text-base">Dikirim Dari</Label>
                    <Input id="shipped_from" name="shipped_from" placeholder="KOTA BEKASI" defaultValue={getSpecDefault('shipped_from')} className="h-12" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Spesifikasi Produk (dinamis dari product.specs, fallback ke default) */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Spesifikasi Produk</h2>
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
                { label: 'Stok', value: get('stock_status', 'TERSEDIA') },
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
                      className={`flex items-center justify-between bg-gray-50 p-3 rounded ${item.fullRow ? 'md:col-span-2' : ''}`}
                    >
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
