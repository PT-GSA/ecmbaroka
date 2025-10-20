import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import WithdrawalRequestForm from '@/components/affiliate/withdrawal-request-form'
import WithdrawalHistory from '@/components/affiliate/withdrawal-history'
import AffiliateLayout from '@/components/affiliate/layout'
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react'

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

export default async function AffiliateWithdrawalsPage() {
  const supabase = await createClient()

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
            <CardTitle>Withdrawals</CardTitle>
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

  // Calculate commission
  const eligibleOrders = orders.filter((o) => ['paid', 'verified', 'completed'].includes(o.status))
  const totalCommission = eligibleOrders.reduce((sum, o) => {
    const perCarton = Number(aff.commission_rate || 0) || 10800
    return sum + (perCarton * Number(o.item_count || 0))
  }, 0)

  // Get withdrawal history
  const { data: withdrawalsData } = await supabase
    .from('affiliate_withdrawals')
    .select('*')
    .eq('affiliate_id', aff.id)
    .order('created_at', { ascending: false })
  
  const withdrawals = (withdrawalsData ?? []) as Array<{
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
  }>

  // Calculate available commission (total - withdrawn)
  const totalWithdrawn = withdrawals
    .filter(w => ['approved', 'processing', 'completed'].includes(w.status))
    .reduce((sum, w) => sum + Number(w.amount || 0), 0)
  
  const availableCommission = totalCommission - totalWithdrawn

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
            <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
            <p className="text-gray-600">Kelola pencairan komisi Anda</p>
          </div>
        </div>

        {/* Commission Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Komisi</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Akumulasi komisi dari pesanan</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tersedia</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(availableCommission)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Komisi yang bisa ditarik</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sudah Ditarik</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalWithdrawn)}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Total yang sudah ditarik</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Form and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WithdrawalRequestForm 
            availableCommission={availableCommission}
            minimumWithdrawal={Number(aff.minimum_withdrawal || 50000)}
          />
          <WithdrawalHistory withdrawals={withdrawals} />
        </div>

        {/* Important Information */}
        <Card className="shadow-sm rounded-xl bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Informasi Penting</h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li>• Minimum withdrawal: {formatCurrency(Number(aff.minimum_withdrawal || 50000))}</li>
                  <li>• Proses pencairan memakan waktu 1-3 hari kerja</li>
                  <li>• Pastikan data rekening bank sudah benar</li>
                  <li>• Anda akan mendapat notifikasi setelah transfer selesai</li>
                  <li>• Komisi hanya bisa ditarik dari pesanan yang sudah dikonfirmasi admin</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AffiliateLayout>
  )
}
