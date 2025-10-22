'use client'

import { useState, useEffect, useCallback } from 'react'
import { } from '@/components/ui/card'
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
  TrendingUp,
  RefreshCw
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

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
        console.log('Payments table changed, refreshing...')
        fetchPayments()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        console.log('Orders table changed, refreshing payments...')
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
    setCurrentPage(1) // Reset to first page when filters change
  }, [payments, searchTerm, statusFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex)

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
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Manajemen Pembayaran
                    </h1>
                    <p className="text-gray-600 text-lg">Kelola dan monitor semua transaksi pembayaran</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPayments}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Admin Panel
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Pembayaran</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-gray-500">Semua transaksi</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pembayaran Terverifikasi</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(verifiedAmount)}</p>
                <p className="text-xs text-gray-500">Transaksi berhasil</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-sm font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-xs text-gray-500">Menunggu konfirmasi</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-sm font-bold text-purple-600">
                  {payments.length > 0 ? Math.round((payments.filter(p => p.status === 'verified').length / payments.length) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500">Tingkat keberhasilan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
              <p className="text-sm text-gray-600">Cari dan filter pembayaran</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari berdasarkan ID, Order ID, atau nama customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white/50 border-gray-200 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white h-12"
              >
                <option value="all">Semua Status</option>
                <option value="verified">Terverifikasi</option>
                <option value="pending">Pending</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daftar Pembayaran</h3>
                  <p className="text-sm text-gray-600">
                    Menampilkan {paginatedPayments.length} dari {filteredPayments.length} pembayaran
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Halaman {currentPage} dari {totalPages}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Memuat data...</span>
              </div>
            ) : paginatedPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada pembayaran ditemukan</h3>
                <p className="text-gray-600">Belum ada pembayaran yang cocok dengan filter yang Anda pilih.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedPayments.map((payment) => (
                  <div key={payment.id} className="group bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            payment.status === 'verified' ? 'bg-green-100' :
                            payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            {getStatusIcon(payment.status)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg">{payment.id}</h4>
                            <span className="text-gray-400">•</span>
                            <p className="text-sm text-gray-600">Order: {payment.order_id}</p>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Customer:</span>
                              <span>{payment.customer_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Method:</span>
                              <span>{payment.method}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Tanggal:</span>
                              <span>{formatDate(payment.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500">Total pembayaran</p>
                        </div>
                        <div className="flex space-x-2">
                          {payment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={async () => {
                                  setLoading(true)
                                  try {
                                    const { error } = await supabase
                                      .from('payments')
                                      .update({ status: 'verified' })
                                      .eq('id', payment.id)
                                    if (!error) {
                                      console.log('Payment verified successfully')
                                      // also set order status to verified
                                      const orderUpdate = await supabase
                                        .from('orders')
                                        .update({ status: 'verified' })
                                        .eq('id', payment.order_id)
                                      
                                      if (orderUpdate.error) {
                                        console.error('Failed to update order status:', orderUpdate.error)
                                      } else {
                                        console.log('Order status updated to verified')
                                      }
                                      
                                      // trigger commission attribution (silent)
                                      try {
                                        const commissionRes = await fetch(`/api/admin/orders/${payment.order_id}/commission`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' }
                                        })
                                        if (!commissionRes.ok) {
                                          console.error('Commission attribution failed')
                                        }
                                      } catch (err) {
                                        console.error('Commission attribution error:', err)
                                      }
                                      
                                      // send notification
                                      try {
                                        const notificationRes = await fetch('/api/notifications', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ orderId: payment.order_id, status: 'verified' })
                                        })
                                        if (!notificationRes.ok) {
                                          console.error('Notification failed')
                                        }
                                      } catch (err) {
                                        console.error('Notification error:', err)
                                      }
                                      
                                      // Refresh data
                                      await fetchPayments()
                                    } else {
                                      console.error('Failed to verify payment:', error)
                                    }
                                  } finally {
                                    setLoading(false)
                                  }
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
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
                                      console.log('Payment rejected successfully')
                                      // send notification
                                      try {
                                        const notificationRes = await fetch('/api/notifications', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ orderId: payment.order_id, status: 'rejected' })
                                        })
                                        if (!notificationRes.ok) {
                                          console.error('Notification failed')
                                        }
                                      } catch (err) {
                                        console.error('Notification error:', err)
                                      }
                                      // Refresh data
                                      await fetchPayments()
                                    } else {
                                      console.error('Failed to reject payment:', error)
                                    }
                                  } finally {
                                    setLoading(false)
                                  }
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPayments.length)} dari {filteredPayments.length} pembayaran
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Sebelumnya
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2"
                >
                  Selanjutnya
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
