import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import AffiliateLayout from '@/components/affiliate/layout'
import RecentActivity from '@/components/affiliate/recent-activity'
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Eye, Calendar } from 'lucide-react'

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

type AffiliateOrder = {
  order_id: string
  order_date: string
  status: string
  item_count: number
  total_value: number
  customer_masked_name: string
  affiliate_id: string | null
}

type AffiliateClickRow = {
  campaign: string | null
  clicked_at: string
}

// type AffiliateLinkRow = {
//   id: string
//   campaign: string | null
//   url_slug: string
//   active: boolean
//   created_at: string
// }

export default async function AffiliateAnalyticsPage() {
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
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Terjadi kesalahan saat memuat data affiliate.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const aff = affiliate as unknown as AffiliateRow

  // Fetch orders referred to this affiliate
  const { data: ordersData } = await supabase
    .from('v_affiliate_orders')
    .select('*')
    .eq('affiliate_id', aff.id)
    .order('order_date', { ascending: false })

  const orders: AffiliateOrder[] = (ordersData ?? []) as AffiliateOrder[]

  // Fetch clicks data
  const { data: clicksData } = await service
    .from('affiliate_clicks')
    .select('campaign, clicked_at')
    .eq('affiliate_id', aff.id)

  const clicks: AffiliateClickRow[] = (clicksData ?? []) as AffiliateClickRow[]

  // Fetch links data (for future use)
  // const { data: linksData } = await supabase
  //   .from('affiliate_links')
  //   .select('id, campaign, url_slug, active')
  //   .eq('affiliate_id', aff.id)

  // const links: AffiliateLinkRow[] = (linksData ?? []) as AffiliateLinkRow[]

  // Calculate analytics
  const totalClicks = clicks.length
  const totalOrders = orders.length
  // const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_value || 0), 0)
  const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0

  // Calculate commission
  const eligibleOrders = orders.filter((o) => ['paid', 'verified', 'completed'].includes(o.status))
  const totalCommission = eligibleOrders.reduce((sum, o) => {
    const perCarton = Number(aff.commission_rate || 0) || 10800
    return sum + (perCarton * Number(o.item_count || 0))
  }, 0)

  // Group data by date for charts
  const clicksByDate = new Map<string, number>()
  const ordersByDate = new Map<string, number>()
  const revenueByDate = new Map<string, number>()

  // Last 30 days (for future chart implementation)
  // const last30Days = Array.from({ length: 30 }, (_, i) => {
  //   const date = new Date()
  //   date.setDate(date.getDate() - i)
  //   return date.toISOString().split('T')[0]
  // }).reverse()

  clicks.forEach((c) => {
    const date = c.clicked_at.split('T')[0]
    clicksByDate.set(date, (clicksByDate.get(date) || 0) + 1)
  })

  orders.forEach((o) => {
    const date = o.order_date.split('T')[0]
    ordersByDate.set(date, (ordersByDate.get(date) || 0) + 1)
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(o.total_value || 0))
  })

  // Campaign performance
  const clicksByCampaign = new Map<string, number>()
  clicks.forEach((c) => {
    const key = (c.campaign ?? '').trim()
    clicksByCampaign.set(key, (clicksByCampaign.get(key) ?? 0) + 1)
  })

  const ordersByCampaign = new Map<string, number>()
  orders.forEach(() => {
    // For now, we'll use a simple mapping - in real implementation, you'd need to track which campaign led to which order
    ordersByCampaign.set('All Campaigns', (ordersByCampaign.get('All Campaigns') || 0) + 1)
  })

  const campaignPerformance = Array.from(clicksByCampaign.entries()).map(([campaign, clicks]) => ({
    campaign: campaign || 'Unnamed',
    clicks,
    orders: ordersByCampaign.get(campaign) || 0,
    conversionRate: clicks > 0 ? ((ordersByCampaign.get(campaign) || 0) / clicks) * 100 : 0
  }))

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
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Pantau performa dan statistik affiliate Anda</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Klik</p>
                  <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Klik pada link referral</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Pesanan yang berhasil</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Orders / Clicks</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Komisi</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Akumulasi komisi</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performa Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data campaign</p>
                <p className="text-sm">Buat link referral untuk melihat analitik</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaignPerformance.map((campaign, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{campaign.campaign}</h3>
                      <Badge variant="outline">
                        {campaign.conversionRate.toFixed(1)}% conversion
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{campaign.clicks}</p>
                        <p className="text-sm text-gray-600">Klik</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.orders}</p>
                        <p className="text-sm text-gray-600">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{campaign.conversionRate.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">Conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity orders={orders} clicks={clicks} />
      </div>
    </AffiliateLayout>
  )
}
