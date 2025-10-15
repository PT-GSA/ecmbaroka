import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'
import { AffiliateCodeField } from '@/components/admin/affiliate-code-field'

export default async function NewAffiliatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
  if (!typedProfile || typedProfile.role !== 'admin') redirect('/')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Affiliate</h1>
          <p className="text-gray-600">Daftarkan mitra affiliate baru</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/affiliates">Kembali</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Data Affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/admin/affiliates" method="post" className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Pengguna</Label>
                <Input id="email" name="email" type="email" required placeholder="user@example.com" />
                <p className="text-xs text-gray-500">Email akun yang akan dijadikan affiliate</p>
              </div>

              <AffiliateCodeField />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" name="name" placeholder="Nama affiliate (opsional)" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility_level">Level Visibilitas</Label>
                <select id="visibility_level" name="visibility_level" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="basic">basic</option>
                  <option value="enhanced">enhanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Komisi (Rp/karton)</Label>
              <Input id="commission_rate" name="commission_rate" type="number" step="1" min="0" placeholder="contoh: 10800" />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit">Simpan Affiliate</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}