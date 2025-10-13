import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import ProductMediaManager from '@/components/admin/product-media-manager'
import type { Database } from '@/types/database'

interface PageProps {
  searchParams?: Promise<{ pid?: string }>
}

type UserRole = Database['public']['Tables']['user_profiles']['Row']['role']
function hasRole(obj: unknown): obj is { role: UserRole } {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  return typeof o.role === 'string' && (o.role === 'customer' || o.role === 'admin')
}

export default async function AdminProductCreatePage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const sp = searchParams ? await searchParams : undefined
  const pid = sp?.pid

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin-auth/login')
  }

  const profileRes = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileRaw: unknown = profileRes.data
  const role: UserRole | null = hasRole(profileRaw) ? profileRaw.role : null
  if (role !== 'admin') {
    redirect('/')
  }

  async function createProduct(formData: FormData) {
    'use server'
    const supa = await createClient()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const price = Number(formData.get('price') || 0)
    const stock = Number(formData.get('stock') || 0)
    const image_url = String(formData.get('image_url') || '').trim() || null
    const is_active = formData.get('is_active') === 'on'

    // Build specs JSON from form fields
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
    const specs: Record<string, string> = {}
    for (const key of specKeys) {
      const raw = formData.get(key)
      const val = raw ? String(raw).trim() : ''
      if (val) {
        specs[key] = val
      }
    }

    if (!name || price <= 0) {
      throw new Error('Nama dan harga wajib diisi')
    }

    const specsForInsert: Record<string, unknown> | null =
      Object.keys(specs).length > 0 ? specs : null

    const payload: Database['public']['Tables']['products']['Insert'] = {
      name,
      description: description || null,
      price,
      stock,
      image_url,
      is_active,
      specs: specsForInsert,
    }

    const productsInsert = supa.from('products') as unknown as {
      insert: (
        values:
          | Database['public']['Tables']['products']['Insert']
          | Database['public']['Tables']['products']['Insert'][]
      ) => {
        select: () => {
          single: () => Promise<{
            data: Database['public']['Tables']['products']['Row'] | null
            error: unknown
          }>
        }
      }
    }

    const { data, error } = await productsInsert
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      const errMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Gagal membuat produk'
      throw new Error(errMessage)
    }

    
    redirect(`/admin/products/new?pid=${data.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Tambah Produk</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-6" action={createProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk</Label>
                <Input id="name" name="name" placeholder="Contoh: Susu Steril 1L" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga</Label>
                <Input id="price" name="price" type="number" step="1" placeholder="Contoh: 25000" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input id="stock" name="stock" type="number" step="1" placeholder="Contoh: 100" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Gambar (opsional)</Label>
                <Input id="image_url" name="image_url" placeholder="https://..." className="h-12" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Tuliskan deskripsi produk"
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-32"
                />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <input id="is_active" name="is_active" type="checkbox" defaultChecked />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
            </div>

            <Separator />

            {/* Spesifikasi Produk */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold">Spesifikasi Produk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock_status">Stok</Label>
                  <Input id="stock_status" name="stock_status" placeholder="TERSEDIA" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Merek</Label>
                  <Input id="brand" name="brand" placeholder="Baroka" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage_condition">Kondisi Penyimpanan</Label>
                  <Input id="storage_condition" name="storage_condition" placeholder="Suhu Ruangan" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flavor">Rasa</Label>
                  <Input id="flavor" name="flavor" placeholder="Mawar" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin_country">Negara Asal</Label>
                  <Input id="origin_country" name="origin_country" placeholder="Indonesia" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelf_life">Masa Penyimpanan</Label>
                  <Input id="shelf_life" name="shelf_life" placeholder="12 Bulan" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet_menu">Menu Makanan Khusus</Label>
                  <Input id="diet_menu" name="diet_menu" placeholder="Halal, Menu Sehat" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty_per_pack">Quantity per Pack</Label>
                  <Input id="qty_per_pack" name="qty_per_pack" placeholder="1" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_product">Produk Custom</Label>
                  <Input id="custom_product" name="custom_product" placeholder="Tidak" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Tanggal Kedaluwarsa</Label>
                  <Input id="expiry_date" name="expiry_date" placeholder="20-02-2026" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <Input id="volume" name="volume" placeholder="180ml" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="units_per_pack">Jumlah Produk Dalam Kemasan</Label>
                  <Input id="units_per_pack" name="units_per_pack" placeholder="24" className="h-12" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="halal_cert_no">No. Sertifikasi (Halal)</Label>
                  <Input id="halal_cert_no" name="halal_cert_no" placeholder="-" className="h-12" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="shipped_from">Dikirim Dari</Label>
                  <Input id="shipped_from" name="shipped_from" placeholder="KOTA BEKASI" className="h-12" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Simpan & Lanjutkan
              </Button>
            </div>
            <p className="text-sm text-gray-500">Setelah tersimpan, form unggah gambar akan muncul di bawah.</p>
          </form>
        </CardContent>
      </Card>

      {pid && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Media Produk</h2>
            <ProductMediaManager productId={pid} />
            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/admin/products/${pid}`}>Lanjut ke Halaman Edit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}