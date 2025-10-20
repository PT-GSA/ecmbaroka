'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, ShoppingCart, Eye, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Pagination from '@/components/ui/pagination'

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

interface ActivityTimelineProps {
  orders: AffiliateOrder[]
  clicks: AffiliateClickRow[]
  withdrawals: AffiliateWithdrawal[]
}

export default function ActivityTimeline({ orders, clicks, withdrawals }: ActivityTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // Combine all activities
  const allActivities = [
    ...orders.map(order => ({
      type: 'order' as const,
      id: order.order_id,
      date: order.order_date,
      data: order
    })),
    ...clicks.map(click => ({
      type: 'click' as const,
      id: `click-${click.clicked_at}`,
      date: click.clicked_at,
      data: click
    })),
    ...withdrawals.map(withdrawal => ({
      type: 'withdrawal' as const,
      id: withdrawal.id,
      date: withdrawal.created_at,
      data: withdrawal
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalPages = Math.ceil(allActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentActivities = allActivities.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Status badge styles
  const statusBadgeClass: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    verified: 'bg-emerald-100 text-emerald-800',
    processing: 'bg-orange-100 text-orange-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-rose-100 text-rose-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Timeline Aktivitas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {allActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada aktivitas</p>
            <p className="text-sm">Mulai bagikan link referral Anda</p>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {currentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'order' ? 'bg-blue-100' :
                    activity.type === 'click' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'order' ? (
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    ) : activity.type === 'click' ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <History className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {activity.type === 'order' && `Order #${(activity.data as AffiliateOrder).order_id.slice(0, 8)}`}
                        {activity.type === 'click' && 'Klik pada Link Referral'}
                        {activity.type === 'withdrawal' && `Withdrawal Request`}
                      </h3>
                      {activity.type === 'order' && (
                        <Badge className={statusBadgeClass[(activity.data as AffiliateOrder).status] || 'bg-gray-100 text-gray-700'}>
                          {(activity.data as AffiliateOrder).status}
                        </Badge>
                      )}
                      {activity.type === 'withdrawal' && (
                        <Badge className={statusBadgeClass[(activity.data as AffiliateWithdrawal).status] || 'bg-gray-100 text-gray-700'}>
                          {(activity.data as AffiliateWithdrawal).status}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {activity.type === 'order' && (
                        <>
                          <p>Customer: {(activity.data as AffiliateOrder).customer_masked_name}</p>
                          <p>Items: {(activity.data as AffiliateOrder).item_count} | Total: {formatCurrency(Number((activity.data as AffiliateOrder).total_value || 0))}</p>
                        </>
                      )}
                      {activity.type === 'click' && (
                        <p>Campaign: {(activity.data as AffiliateClickRow).campaign || 'Unnamed'}</p>
                      )}
                      {activity.type === 'withdrawal' && (
                        <>
                          <p>Amount: {formatCurrency((activity.data as AffiliateWithdrawal).amount)}</p>
                          <p>Bank: {(activity.data as AffiliateWithdrawal).bank_name} - {(activity.data as AffiliateWithdrawal).account_number}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(activity.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {allActivities.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
