'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, ShoppingCart, Users } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
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

interface RecentActivityProps {
  orders: AffiliateOrder[]
  clicks: AffiliateClickRow[]
}

export default function RecentActivity({ orders, clicks }: RecentActivityProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // Combine and sort activities
  const allActivities = [
    ...clicks.map(click => ({ ...click, type: 'click' as const })),
    ...orders.map(order => ({ ...order, type: 'order' as const }))
  ].sort((a, b) => {
    const dateA = a.type === 'click' ? a.clicked_at : a.order_date
    const dateB = b.type === 'click' ? b.clicked_at : b.order_date
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  const totalPages = Math.ceil(allActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentActivities = allActivities.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {currentActivities.length > 0 ? (
            currentActivities.map((item, index) => {
              const isClick = item.type === 'click'
              const date = isClick ? item.clicked_at : item.order_date
              
              return (
                <div key={index} className="flex items-center gap-3 p-4 border-b border-gray-100 last:border-b-0">
                  <div className={`p-2 rounded-full ${isClick ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {isClick ? (
                      <Eye className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {isClick ? 'Klik pada link referral' : `Order #${item.order_id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isClick ? `Campaign: ${item.campaign || 'Unnamed'}` : `Customer: ${item.customer_masked_name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {formatDate(date)}
                    </p>
                    {!isClick && (
                      <p className="text-xs text-gray-500">
                        {formatCurrency(Number(item.total_value || 0))}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada aktivitas</p>
              <p className="text-sm">Mulai bagikan link referral Anda</p>
            </div>
          )}
        </div>
        
        {allActivities.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  )
}
