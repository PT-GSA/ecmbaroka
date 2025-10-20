'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Withdrawal {
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

interface WithdrawalHistoryProps {
  withdrawals: Withdrawal[]
  loading?: boolean
  onRefresh?: () => void
}

export default function WithdrawalHistory({ 
  withdrawals, 
  loading = false, 
  onRefresh 
}: WithdrawalHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      processing: 'default',
      completed: 'default',
      rejected: 'destructive'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || 'secondary'}
        className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}
      >
        {getStatusIcon(status)}
            <span className="ml-1 capitalize">{
              status === 'pending' ? 'Menunggu' :
              status === 'approved' ? 'Disetujui' :
              status === 'processing' ? 'Diproses' :
              status === 'completed' ? 'Selesai' :
              status === 'rejected' ? 'Ditolak' :
              status
            }</span>
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Pencairan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Memuat riwayat pencairan...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Pencairan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada request pencairan</p>
            <p className="text-sm">Riwayat pencairan Anda akan muncul di sini</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Pencairan
          </CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Segarkan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => {
            const isExpanded = expandedItems.has(withdrawal.id)
            
            return (
              <div key={withdrawal.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{formatCurrency(withdrawal.amount)}</h3>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {withdrawal.bank_name} - {withdrawal.account_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      Diminta: {formatDate(withdrawal.created_at)}
                    </p>
                    {withdrawal.processed_at && (
                      <p className="text-sm text-gray-500">
                        Diproses: {formatDate(withdrawal.processed_at)}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(withdrawal.id)}
                  >
                    {isExpanded ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Detail Bank</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Bank:</strong> {withdrawal.bank_name}</p>
                        <p><strong>Nomor Rekening:</strong> {withdrawal.account_number}</p>
                        <p><strong>Pemegang Rekening:</strong> {withdrawal.account_holder_name}</p>
                      </div>
                    </div>

                    {withdrawal.request_notes && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Catatan Anda</h4>
                        <p className="text-sm text-gray-600">{withdrawal.request_notes}</p>
                      </div>
                    )}

                    {withdrawal.admin_notes && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Catatan Admin</h4>
                        <p className="text-sm text-gray-600">{withdrawal.admin_notes}</p>
                      </div>
                    )}

                    {withdrawal.transfer_reference && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Referensi Transfer</h4>
                        <p className="text-sm text-gray-600 font-mono">{withdrawal.transfer_reference}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
