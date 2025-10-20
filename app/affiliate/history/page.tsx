import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AffiliateLayout from '@/components/affiliate/layout'
import ActivityTimeline from '@/components/affiliate/activity-timeline'
import { History, ShoppingCart, Eye, Filter, Download } from 'lucide-react'

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

type AffiliateWithdrawal = {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  bank_name: string
  account_number: string
  account_holder_name: string
  request_notes?: string
  admin_notes?: string
  transfer_reference?: string
  created_at: string
  processed_at?: string
}

export default async function AffiliateHistoryPage() {
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
            <CardTitle>History</CardTitle>
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
    .order('clicked_at', { ascending: false })

  const clicks: AffiliateClickRow[] = (clicksData ?? []) as AffiliateClickRow[]

  // Fetch withdrawal history
  const { data: withdrawalsData } = await supabase
    .from('affiliate_withdrawals')
    .select('*')
    .eq('affiliate_id', aff.id)
    .order('created_at', { ascending: false })
  
  const withdrawals: AffiliateWithdrawal[] = (withdrawalsData ?? []) as AffiliateWithdrawal[]


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
            <h1 className="text-2xl font-bold text-gray-900">History</h1>
            <p className="text-gray-600">Riwayat aktivitas dan transaksi affiliate Anda</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Pesanan yang berhasil</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{clicks.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Klik pada link referral</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Withdrawals</p>
                  <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <History className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Request pencairan</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <ActivityTimeline orders={orders} clicks={clicks} withdrawals={withdrawals} />
      </div>
    </AffiliateLayout>
  )
}
