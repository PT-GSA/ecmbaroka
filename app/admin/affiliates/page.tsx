import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Database } from '@/types/database'

type AffiliateRow = Database['public']['Tables']['affiliates']['Row']
type AffiliateLinkRow = Database['public']['Tables']['affiliate_links']['Row']

export default async function AdminAffiliatesPage() {
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

  const { data: affiliates } = await supabase
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })
  const affs: AffiliateRow[] = Array.isArray(affiliates) ? (affiliates as AffiliateRow[]) : []

  // Preload links grouped by affiliate
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('*')
    .order('created_at', { ascending: false })
  const linksByAffiliate: Record<string, AffiliateLinkRow[]> = {}
  const typedLinks: AffiliateLinkRow[] = Array.isArray(links) ? (links as AffiliateLinkRow[]) : []
  typedLinks.forEach((l: AffiliateLinkRow) => {
    const key = l.affiliate_id
    if (!linksByAffiliate[key]) linksByAffiliate[key] = []
    linksByAffiliate[key].push(l)
  })

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
              </div>

              <div className="space-y-3">
                <div className="font-semibold">Links Kampanye</div>
                {(
                  (linksByAffiliate[a.id] ?? []) as AffiliateLinkRow[]
                ).map((l: AffiliateLinkRow) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded">{l.url_slug}</code>
                    <span className="text-sm">{l.campaign ?? '-'}</span>
                    <span className="ml-auto text-xs text-gray-500">{l.active ? 'aktif' : 'nonaktif'}</span>
                  </div>
                ))}
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