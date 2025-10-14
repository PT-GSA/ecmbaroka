'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminPaymentItem {
  id: string
  order_id: string
  customer_name: string
  amount: number
  method: string
  status: 'pending' | 'verified' | 'rejected'
  created_at: string
}

export default function AdminPayments() {
  const supabase = createClient()
  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [filteredPayments, setFilteredPayments] = useState<AdminPaymentItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string>('')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payments')
      if (!res.ok) {
        setError('Gagal memuat data pembayaran')
        setPayments([])
      } else {
        const json = await res.json()
        const items: AdminPaymentItem[] = (json?.payments ?? [])
        setPayments(items)
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
    // Realtime refresh when payments change
    const channel = supabase
      .channel('admin-payments-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPayments, supabase])

  useEffect(() => {
    let filtered = payments

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    setFilteredPayments(filtered)
  }, [payments, searchTerm, statusFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: AdminPaymentItem['status']) => {
    const variants = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    }

    const labels = {
      verified: 'Terverifikasi',
      pending: 'Pending',
      rejected: 'Ditolak',
    }

    return (
      <Badge variant="secondary" className={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const getStatusIcon = (status: AdminPaymentItem['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const verifiedAmount = payments
    .filter(p => p.status === 'verified')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingCount = payments.filter(p => p.status === 'pending').length

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Pembayaran
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola dan monitor semua transaksi pembayaran
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CreditCard className="w-4 h-4 mr-1" />
          Admin Panel
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Semua transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Terverifikasi</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(verifiedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Transaksi berhasil
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu konfirmasi
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {payments.length > 0 && totalAmount > 0 ? Math.round((verifiedAmount / totalAmount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tingkat keberhasilan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari berdasarkan ID, Order ID, atau nama customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="verified">Terverifikasi</option>
                <option value="pending">Pending</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembayaran</CardTitle>
          <CardDescription>
            {filteredPayments.length} dari {payments.length} pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data pembayaran yang ditemukan
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{payment.id}</p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-600">Order: {payment.order_id}</p>
                      </div>
                      <p className="text-sm text-gray-500">{payment.customer_name}</p>
                      <p className="text-xs text-gray-400">
                        {payment.method} • {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    </div>
                    {getStatusBadge(payment.status)}
                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={async () => {
                              setLoading(true)
                              try {
                                const { error } = await supabase
                                  .from('payments')
                                  .update({ status: 'verified' })
                                  .eq('id', payment.id)
                                if (!error) {
                                  // also set order status to verified
                                  await supabase
                                    .from('orders')
                                    .update({ status: 'verified' })
                                    .eq('id', payment.order_id)
                                  // send notification
                                  try {
                                    await fetch('/api/notifications', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: payment.order_id, status: 'verified' })
                                    })
                                  } catch {}
                                  fetchPayments()
                                }
                              } finally {
                                setLoading(false)
                              }
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={async () => {
                              setLoading(true)
                              try {
                                const { error } = await supabase
                                  .from('payments')
                                  .update({ status: 'rejected' })
                                  .eq('id', payment.id)
                                if (!error) {
                                  try {
                                    await fetch('/api/notifications', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: payment.order_id, status: 'rejected' })
                                    })
                                  } catch {}
                                  fetchPayments()
                                }
                              } finally {
                                setLoading(false)
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
