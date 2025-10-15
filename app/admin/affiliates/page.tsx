import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { headers, cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'
import CopyInput from '@/components/ui/copy-input'
import { Badge } from '@/components/ui/badge'

type AffiliateRow = Database['public']['Tables']['affiliates']['Row']
type AffiliateLinkRow = Database['public']['Tables']['affiliate_links']['Row']

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string; q?: string; status?: 'active' | 'inactive'; vis?: 'basic' | 'enhanced' }>
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

  // Simple server-side filters based on query params
  const q = sp?.q ? sp.q.toLowerCase() : ''
  const statusFilter = sp?.status
  const visFilter = sp?.vis

  let filteredAffs = affs
  if (q) {
    filteredAffs = filteredAffs.filter((a) =>
      [a.name ?? '', a.email ?? '', a.code ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }
  if (statusFilter === 'active' || statusFilter === 'inactive') {
    filteredAffs = filteredAffs.filter((a) => a.status === statusFilter)
  }
  if (visFilter === 'basic' || visFilter === 'enhanced') {
    filteredAffs = filteredAffs.filter((a) => a.visibility_level === visFilter)
  }

  // Calculate statistics
  const totalAffiliates = affs.length
  const activeAffiliates = affs.filter(a => a.status === 'active').length
  const totalLinks = typedLinks.length
  const activeLinks = typedLinks.filter(l => l.active).length

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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Dashboard Affiliates
                    </h1>
                    <p className="text-gray-600 text-lg">Kelola mitra affiliate dan kampanye marketing</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  <Link href="/admin/affiliates/new" className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Affiliate
                  </Link>
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Affiliates</p>
                    <p className="text-2xl font-bold text-blue-900">{totalAffiliates}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-2xl font-bold text-green-900">{activeAffiliates}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Total Links</p>
                    <p className="text-2xl font-bold text-purple-900">{totalLinks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">Active Links</p>
                    <p className="text-2xl font-bold text-orange-900">{activeLinks}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <form action="/admin/affiliates" method="get" className="flex-1">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input 
                      name="q" 
                      defaultValue={sp?.q ?? ''} 
                      placeholder="Cari nama, email, atau kode affiliate..." 
                      className="pl-10 h-12 bg-white/50 border-gray-200 focus:bg-white transition-all duration-200" 
                    />
                  </div>
                </form>
                <div className="flex items-center gap-2">
                  {(() => {
                    const base = new URLSearchParams()
                    if (q) base.set('q', q)
                    if (visFilter) base.set('vis', visFilter)
                    const activeQs = new URLSearchParams(base)
                    activeQs.set('status', 'active')
                    const inactiveQs = new URLSearchParams(base)
                    inactiveQs.set('status', 'inactive')
                    const allQs = new URLSearchParams(base)
                    allQs.delete('status')
                    return (
                      <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                        <Link 
                          href={`/admin/affiliates?${allQs.toString()}`} 
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            !statusFilter 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Semua
                        </Link>
                        <Link 
                          href={`/admin/affiliates?${activeQs.toString()}`} 
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            statusFilter === 'active' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Active
                        </Link>
                        <Link 
                          href={`/admin/affiliates?${inactiveQs.toString()}`} 
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            statusFilter === 'inactive' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Inactive
                        </Link>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {sp?.success && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Sukses!</h3>
                <p className="text-green-700">
                  {sp.success === 'created' && 'Affiliate berhasil dibuat.'}
                  {sp.success === '1' && 'Link kampanye berhasil dibuat.'}
                  {sp.success === 'link_deleted' && 'Link kampanye berhasil dihapus.'}
                  {sp.success === 'updated' && 'Affiliate berhasil diperbarui.'}
                  {sp.success === 'deleted' && 'Affiliate berhasil dihapus.'}
                  {!['created','1'].includes(sp.success!) && 'Aksi berhasil dilakukan.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {sp?.error && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200 shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Gagal!</h3>
                <p className="text-red-700">
                  {sp.error === 'missing_fields' && 'Mohon isi email dan kode.'}
                  {sp.error === 'user_lookup_failed' && 'Gagal mencari pengguna berdasarkan email.'}
                  {sp.error === 'user_not_found' && 'Pengguna dengan email tersebut tidak ditemukan.'}
                  {sp.error === 'create_failed' && 'Gagal membuat affiliate baru.'}
                  {sp.error === 'update_failed' && 'Gagal memperbarui affiliate.'}
                  {sp.error === 'delete_failed' && 'Gagal menghapus affiliate.'}
                  {sp.error === 'invalid_commission' && 'Nilai komisi tidak valid. Gunakan angka ≥ 0.'}
                  {!['missing_fields','user_lookup_failed','user_not_found','create_failed'].includes(sp.error!) && 'Terjadi kesalahan.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Affiliates Grid */}
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredAffs.map((a) => (
            <div key={a.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden max-h-[800px] overflow-y-auto">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{a.name || a.code}</h3>
                      {a.email && <p className="text-xs text-gray-600 truncate">{a.email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={a.status === 'active' ? 'success' : 'secondary'} 
                      className="capitalize text-xs px-2 py-1"
                    >
                      {a.status}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="capitalize text-xs px-2 py-1"
                    >
                      {a.visibility_level}
                    </Badge>
                  </div>
                </div>
              </div>
              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Affiliate Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Kode</span>
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{a.code}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Komisi</span>
                    <span className="font-bold text-green-600 text-sm">
                      {typeof a.commission_rate === 'number' ? `${formatCurrency(Number(a.commission_rate || 0))} / karton` : '-'}
                    </span>
                  </div>
                </div>

                {/* Campaign Links */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <h4 className="font-semibold text-gray-900 text-sm">Links Kampanye</h4>
                  </div>
                  
                  {(
                    (linksByAffiliate[a.id] ?? []) as AffiliateLinkRow[]
                  ).map((l: AffiliateLinkRow) => {
                    const linkSlug = `${appUrl}/api/affiliate/track?slug=${encodeURIComponent(l.url_slug)}`
                    const linkAlias = `${appUrl}/api/affiliate/track?link=${encodeURIComponent(l.url_slug)}`
                    return (
                      <div key={l.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-white rounded text-xs font-mono border">{l.url_slug}</code>
                            <span className="text-xs text-gray-600">{l.campaign ?? '-'}</span>
                          </div>
                          <Badge variant={l.active ? 'success' : 'secondary'} className="text-xs px-2 py-0.5">
                            {l.active ? 'aktif' : 'nonaktif'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <CopyInput value={linkSlug} label="Tracking Link (slug=)" />
                          <CopyInput value={linkAlias} label="Alias Tracking Link (link=)" />
                        </div>
                        <div className="flex justify-end">
                          <form action={`/admin/affiliates/${a.id}/links/${l.id}/delete`} method="post">
                            <Button type="submit" variant="destructive" size="sm" className="text-xs h-8">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </Button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
                  
                  {(
                    (linksByAffiliate[a.id] ?? []) as AffiliateLinkRow[]
                  ).length === 0 && (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <p className="text-xs">Belum ada link kampanye</p>
                    </div>
                  )}

                  {/* Create New Link Form */}
                  <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <h4 className="font-semibold text-blue-900 text-sm">Buat Link Baru</h4>
                    </div>
                    <form action={`/admin/affiliates/${a.id}/links/create`} method="post" className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <Label htmlFor={`campaign-${a.id}`} className="text-xs font-medium text-gray-700">Campaign</Label>
                          <Input 
                            id={`campaign-${a.id}`} 
                            name="campaign" 
                            placeholder="Contoh: Ramadan2025" 
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`slug-${a.id}`} className="text-xs font-medium text-gray-700">URL Slug</Label>
                          <Input 
                            id={`slug-${a.id}`} 
                            name="url_slug" 
                            placeholder="contoh-slug" 
                            required 
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Buat Link
                        </Button>
                      </div>
                      <input type="hidden" name="affiliate_id" value={a.id} />
                    </form>
                  </div>
                </div>

                {/* Edit Affiliate Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h4 className="font-semibold text-gray-900 text-sm">Edit Affiliate</h4>
                  </div>
                  
                  <form action={`/admin/affiliates/${a.id}/update`} method="post" className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label htmlFor={`name-${a.id}`} className="text-xs font-medium text-gray-700">Nama</Label>
                        <Input 
                          id={`name-${a.id}`} 
                          name="name" 
                          defaultValue={a.name ?? ''} 
                          placeholder="Nama affiliate" 
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-${a.id}`} className="text-xs font-medium text-gray-700">Email</Label>
                        <Input 
                          id={`email-${a.id}`} 
                          name="email" 
                          defaultValue={a.email ?? ''} 
                          placeholder="email@contoh.com" 
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`code-${a.id}`} className="text-xs font-medium text-gray-700">Kode</Label>
                        <Input 
                          id={`code-${a.id}`} 
                          name="code" 
                          defaultValue={a.code ?? ''} 
                          placeholder="KODEAFF" 
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`status-${a.id}`} className="text-xs font-medium text-gray-700">Status</Label>
                        <select 
                          id={`status-${a.id}`} 
                          name="status" 
                          defaultValue={a.status ?? ''} 
                          className="w-full h-8 rounded-md border border-gray-300 bg-white px-2 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`visibility-${a.id}`} className="text-xs font-medium text-gray-700">Visibilitas</Label>
                        <select 
                          id={`visibility-${a.id}`} 
                          name="visibility_level" 
                          defaultValue={a.visibility_level ?? ''} 
                          className="w-full h-8 rounded-md border border-gray-300 bg-white px-2 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="basic">Basic</option>
                          <option value="enhanced">Enhanced</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`commission-${a.id}`} className="text-xs font-medium text-gray-700">Komisi (Rp/karton)</Label>
                        <Input 
                          id={`commission-${a.id}`} 
                          name="commission_rate" 
                          type="number" 
                          step="1" 
                          min="0" 
                          defaultValue={typeof a.commission_rate === 'number' ? Number(a.commission_rate) : 0} 
                          placeholder="contoh: 10800" 
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Simpan
                      </Button>
                    </div>
                  </form>

                  {/* Delete Button */}
                  <div className="pt-2 border-t border-gray-200">
                    <form action={`/admin/affiliates/${a.id}/delete`} method="post">
                      <Button type="submit" variant="destructive" className="w-full h-8 text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus Affiliate
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty State */}
          {filteredAffs.length === 0 && (
            <div className="col-span-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada affiliate ditemukan</h3>
                <p className="text-gray-600 mb-6">Belum ada affiliate yang cocok dengan filter yang Anda pilih.</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Link href="/admin/affiliates/new" className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Affiliate Pertama
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}