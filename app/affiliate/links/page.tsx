import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resolveAppUrl } from '@/lib/utils'
import CreateAffiliateLinkForm from '@/components/affiliate/create-link-form'
import LinksClient from '@/components/affiliate/links-client'
import AffiliateLayout from '@/components/affiliate/layout'
import { Plus } from 'lucide-react'

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  name: string | null
  email: string | null
  status: 'active' | 'inactive'
  visibility_level: 'basic' | 'enhanced'
  created_at: string
  commission_rate: number
  minimum_withdrawal?: number
}

type AffiliateLinkRow = {
  id: string
  campaign: string | null
  url_slug: string
  active: boolean
  created_at: string
}

type AffiliateClickRow = {
  campaign: string | null
  clicked_at: string
}

export default async function AffiliateLinksPage() {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/affiliate/login')
  }

  // Ensure user is an active affiliate
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Links & Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Terjadi kesalahan saat memuat data affiliate.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const aff = affiliate as unknown as AffiliateRow

  // Fetch affiliate links
  const { data: linksData } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('affiliate_id', aff.id)
    .order('created_at', { ascending: false })

  const links: AffiliateLinkRow[] = (linksData ?? []) as AffiliateLinkRow[]

  // Fetch clicks data
  const { data: clicksData } = await service
    .from('affiliate_clicks')
    .select('campaign, clicked_at')
    .eq('affiliate_id', aff.id)

  const clicks: AffiliateClickRow[] = (clicksData ?? []) as AffiliateClickRow[]

  // Calculate clicks per campaign
  const clicksByCampaign = new Map<string, number>()
  clicks.forEach((c) => {
    const key = (c.campaign ?? '').trim()
    clicksByCampaign.set(key, (clicksByCampaign.get(key) ?? 0) + 1)
  })

  // Build app origin for full tracking links
  const hdrs = await headers()
  const appUrl = resolveAppUrl(hdrs)

  return (
    <AffiliateLayout affiliate={{
      id: aff.id,
      name: aff.name || '',
      code: aff.code,
      email: aff.email || ''
    }}>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Links & Campaigns</h1>
            <p className="text-gray-600">Kelola link referral dan campaign Anda</p>
          </div>
        </div>

        {/* Create New Link */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Buat Link Referral Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateAffiliateLinkForm appUrl={appUrl} />
          </CardContent>
        </Card>

        {/* Links List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Link Referral Anda</h2>
          
          <LinksClient 
            links={links}
            clicks={clicks}
            appUrl={appUrl}
          />
        </div>

        {/* Tips */}
        <Card className="shadow-sm rounded-xl bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips untuk Meningkatkan Konversi</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Gunakan nama campaign yang menarik dan mudah diingat</li>
              <li>• Bagikan link di media sosial dengan konten yang menarik</li>
              <li>• Buat beberapa campaign untuk audiens yang berbeda</li>
              <li>• Pantau performa setiap campaign secara berkala</li>
              <li>• Gunakan slug yang pendek dan mudah diingat</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AffiliateLayout>
  )
}
