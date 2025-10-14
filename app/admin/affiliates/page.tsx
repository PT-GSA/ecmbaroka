import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { headers, cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Database } from '@/types/database'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import CopyInput from '@/components/ui/copy-input'

type AffiliateRow = Database['public']['Tables']['affiliates']['Row']
type AffiliateLinkRow = Database['public']['Tables']['affiliate_links']['Row']

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
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

  // Ambil via admin API agar pasti bypass RLS (gunakan absolute URL)
  const hdrs = await headers()
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000'
  const origin = `${proto}://${host}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join('; ')
  const res = await fetch(new URL('/api/admin/affiliates', origin), {
    cache: 'no-store',
    redirect: 'manual',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
  let affs: AffiliateRow[] = []
  let typedLinks: AffiliateLinkRow[] = []
  if (res.ok) {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      affs = Array.isArray(json.affiliates) ? (json.affiliates as AffiliateRow[]) : []
      typedLinks = Array.isArray(json.links) ? (json.links as AffiliateLinkRow[]) : []
    }
  }

  const linksByAffiliate: Record<string, AffiliateLinkRow[]> = {}
  typedLinks.forEach((l: AffiliateLinkRow) => {
    const key = l.affiliate_id
    if (!linksByAffiliate[key]) linksByAffiliate[key] = []
    linksByAffiliate[key].push(l)
  })

  const sp = searchParams ? await searchParams : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Affiliates</h1>
          <p className="text-gray-600">Manajemen mitra affiliate dan link kampanye</p>
        </div>
        <Button asChild>
          <Link href="/admin/affiliates/new">Tambah Affiliate</Link>
        </Button>
      </div>

      {sp?.success && (
        <Alert>
          <AlertTitle>Sukses</AlertTitle>
          <AlertDescription>
            {sp.success === 'created' && 'Affiliate berhasil dibuat.'}
            {sp.success === '1' && 'Link kampanye berhasil dibuat.'}
            {sp.success === 'link_deleted' && 'Link kampanye berhasil dihapus.'}
            {sp.success === 'updated' && 'Affiliate berhasil diperbarui.'}
            {sp.success === 'deleted' && 'Affiliate berhasil dihapus.'}
            {!['created','1'].includes(sp.success!) && 'Aksi berhasil dilakukan.'}
          </AlertDescription>
        </Alert>
      )}

      {sp?.error && (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>
            {sp.error === 'missing_fields' && 'Mohon isi email dan kode.'}
            {sp.error === 'user_lookup_failed' && 'Gagal mencari pengguna berdasarkan email.'}
            {sp.error === 'user_not_found' && 'Pengguna dengan email tersebut tidak ditemukan.'}
            {sp.error === 'create_failed' && 'Gagal membuat affiliate baru.'}
            {sp.error === 'update_failed' && 'Gagal memperbarui affiliate.'}
            {sp.error === 'delete_failed' && 'Gagal menghapus affiliate.'}
            {sp.error === 'invalid_commission' && 'Nilai komisi tidak valid. Gunakan 0–100.'}
            {!['missing_fields','user_lookup_failed','user_not_found','create_failed'].includes(sp.error!) && 'Terjadi kesalahan.'}
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="grid md:grid-cols-2 gap-6">
        {affs.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{a.name || a.code}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 mb-3">
                <div>Status: <span className="font-medium">{a.status}</span></div>
                <div>Visibilitas: <span className="font-medium">{a.visibility_level}</span></div>
                <div>Email: {a.email ?? '-'}</div>
                <div>Kode: <code>{a.code}</code></div>
                <div>Komisi: <span className="font-medium">{typeof a.commission_rate === 'number' ? `${a.commission_rate}%` : '-'}</span></div>
              </div>

              <div className="space-y-3">
                <div className="font-semibold">Links Kampanye</div>
                {(
                  (linksByAffiliate[a.id] ?? []) as AffiliateLinkRow[]
                ).map((l: AffiliateLinkRow) => {
                  const linkSlug = `${appUrl}/api/affiliate/track?slug=${encodeURIComponent(l.url_slug)}`
                  const linkAlias = `${appUrl}/api/affiliate/track?link=${encodeURIComponent(l.url_slug)}`
                  return (
                    <div key={l.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded">{l.url_slug}</code>
                        <span className="text-sm">{l.campaign ?? '-'}</span>
                        <span className="ml-auto text-xs text-gray-500">{l.active ? 'aktif' : 'nonaktif'}</span>
                      </div>
                      <CopyInput value={linkSlug} label="Tracking Link (slug=)" />
                      <CopyInput value={linkAlias} label="Alias Tracking Link (link=)" />
                      <div className="flex justify-end">
                        <form action={`/admin/affiliates/${a.id}/links/${l.id}/delete`} method="post">
                          <Button type="submit" variant="destructive" size="sm">Hapus</Button>
                        </form>
                      </div>
                    </div>
                  )
                })}
                {(
                  (linksByAffiliate[a.id] ?? []) as AffiliateLinkRow[]
                ).length === 0 && (
                  <div className="text-sm text-gray-500">Belum ada link.</div>
                )}

                <form className="mt-4" action={`/admin/affiliates/${a.id}/links/create`} method="post">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`campaign-${a.id}`}>Campaign</Label>
                      <Input id={`campaign-${a.id}`} name="campaign" placeholder="Contoh: Ramadan2025" />
                    </div>
                    <div>
                      <Label htmlFor={`slug-${a.id}`}>URL Slug</Label>
                      <Input id={`slug-${a.id}`} name="url_slug" placeholder="contoh-slug" required />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit">Buat Link</Button>
                    </div>
                  </div>
                  <input type="hidden" name="affiliate_id" value={a.id} />
                </form>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="font-semibold">Edit Affiliate</div>
                  <form action={`/admin/affiliates/${a.id}/update`} method="post" className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`name-${a.id}`}>Nama</Label>
                      <Input id={`name-${a.id}`} name="name" defaultValue={a.name ?? ''} placeholder="Nama affiliate" />
                    </div>
                    <div>
                      <Label htmlFor={`email-${a.id}`}>Email</Label>
                      <Input id={`email-${a.id}`} name="email" defaultValue={a.email ?? ''} placeholder="email@contoh.com" />
                    </div>
                    <div>
                      <Label htmlFor={`code-${a.id}`}>Kode</Label>
                      <Input id={`code-${a.id}`} name="code" defaultValue={a.code ?? ''} placeholder="KODEAFF" />
                    </div>
                    <div>
                      <Label htmlFor={`status-${a.id}`}>Status</Label>
                      <Input id={`status-${a.id}`} name="status" defaultValue={a.status ?? ''} placeholder="aktif/nonaktif" />
                    </div>
                    <div>
                      <Label htmlFor={`visibility-${a.id}`}>Visibilitas</Label>
                      <Input id={`visibility-${a.id}`} name="visibility_level" defaultValue={a.visibility_level ?? ''} placeholder="basic/enhanced" />
                    </div>
                    <div>
                      <Label htmlFor={`commission-${a.id}`}>Komisi (%)</Label>
                      <Input id={`commission-${a.id}`} name="commission_rate" type="number" step="0.01" min="0" max="100" defaultValue={typeof a.commission_rate === 'number' ? a.commission_rate : 0} placeholder="contoh: 10 atau 12.5" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit">Simpan</Button>
                    </div>
                  </form>

                  <form action={`/admin/affiliates/${a.id}/delete`} method="post" className="mt-2">
                    <Button type="submit" variant="destructive">Hapus Affiliate</Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {affs.length === 0 && (
          <div className="text-sm text-gray-600">Belum ada affiliate terdaftar.</div>
        )}
      </div>
    </div>
  )
}