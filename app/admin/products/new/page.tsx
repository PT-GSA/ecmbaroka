import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default async function AdminProductCreatePage() {
  const supabase = await createClient()

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

  if (!profile || profile.role !== 'admin') {
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
    const is_active = formData.get('is_active') ? true : true

    if (!name || price <= 0) {
      throw new Error('Nama dan harga wajib diisi')
    }

    const { data, error } = await supa
      .from('products')
      .insert({ name, description, price, stock, image_url, is_active })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Gagal membuat produk')
    }

    redirect(`/admin/products/${data.id}`)
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
                <Input id="name" name="name" placeholder="Contoh: Susu Steril 1L" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga</Label>
                <Input id="price" name="price" type="number" step="1" placeholder="Contoh: 25000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input id="stock" name="stock" type="number" step="1" placeholder="Contoh: 100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Gambar (opsional)</Label>
                <Input id="image_url" name="image_url" placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Simpan & Lanjutkan
              </Button>
            </div>
            <p className="text-sm text-gray-500">Setelah tersimpan, Anda dapat mengunggah gambar di halaman edit.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}