import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resolveAppUrl } from '@/lib/utils'
import AffiliateLinksWrapper from '@/components/affiliate/affiliate-links-wrapper'
import AffiliateLayout from '@/components/affiliate/layout'

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
      <AffiliateLinksWrapper 
        initialLinks={links}
        clicks={clicks}
        appUrl={appUrl}
      />
    </AffiliateLayout>
  )
}
