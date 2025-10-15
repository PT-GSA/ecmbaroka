'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  Receipt
} from 'lucide-react'
 

// Removed unused PaymentRow type

interface Transaction {
  id: string
  order_id: string
  bank_name: string
  account_name: string
  transfer_date: string
  amount: number
  status: 'pending' | 'verified' | 'rejected'
  proof_image_url?: string
  admin_notes?: string
  created_at: string
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const supabase = createClient()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customer/transactions')
      if (!res.ok) {
        console.error('Error fetching transactions')
        setTransactions([])
      } else {
        const json = await res.json()
        const transactionsData: Transaction[] = json?.transactions ?? []
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        return
      }
      setUser(user)
      fetchTransactions()
    }

    checkAuth()

    // Realtime: refresh saat ada perubahan pada payments
    const channel = supabase
      .channel('customer-transactions-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchTransactions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTransactions, supabase])

  // Filter transactions based on search, status, and date
  useEffect(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
      
      const matchesDate = !dateFilter || transaction.transfer_date.startsWith(dateFilter)
      
      return matchesSearch && matchesStatus && matchesDate
    })
    setFilteredTransactions(filtered)
    setCurrentPage(1) // Reset to first page when filter changes
  }, [transactions, searchTerm, statusFilter, dateFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Calculate stats
  const totalTransactions = transactions.length
  const totalAmount = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length
  const verifiedTransactions = transactions.filter(t => t.status === 'verified').length

  // Auth guard check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Butuh Login</h1>
          <p className="text-gray-600 mb-6">Silakan login untuk melihat riwayat transaksi Anda.</p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <a href="/login">Login</a>
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, label: 'Menunggu Verifikasi' },
      verified: { variant: 'default' as const, label: 'Terverifikasi' },
      rejected: { variant: 'destructive' as const, label: 'Ditolak' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

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
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Riwayat Transaksi
                    </h1>
                    <p className="text-gray-600 text-lg">Kelola dan lacak semua transaksi pembayaran Anda</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Customer Panel
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
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                <p className="text-xs text-gray-500">Semua transaksi</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Pembayaran</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-gray-500">Total pengeluaran</p>
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
                <p className="text-2xl font-bold text-yellow-600">{pendingTransactions}</p>
                <p className="text-xs text-gray-500">Menunggu verifikasi</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Terverifikasi</p>
                <p className="text-2xl font-bold text-purple-600">{verifiedTransactions}</p>
                <p className="text-xs text-gray-500">Transaksi berhasil</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filter Transaksi</h3>
              <p className="text-sm text-gray-600">Cari dan filter transaksi berdasarkan kriteria tertentu</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Verifikasi</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
            
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daftar Transaksi</h3>
                  <p className="text-sm text-gray-600">
                    Menampilkan {paginatedTransactions.length} dari {filteredTransactions.length} transaksi
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
                <span className="ml-3 text-gray-600">Memuat transaksi...</span>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || dateFilter
                    ? 'Tidak Ada Transaksi yang Sesuai'
                    : 'Belum Ada Transaksi'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' || dateFilter
                    ? 'Tidak ada transaksi yang sesuai dengan filter yang dipilih.'
                    : 'Anda belum memiliki riwayat transaksi.'
                  }
                </p>
                {(searchTerm || statusFilter !== 'all' || dateFilter) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setDateFilter('')
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedTransactions.map((transaction) => (
                  <div key={transaction.id} className="group bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">Transaksi #{transaction.order_id.slice(-8)}</h4>
                          <p className="text-sm text-gray-600">{formatDate(transaction.transfer_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                          <p className="text-xs text-gray-500">Total pembayaran</p>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Bank Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                          </div>
                          <h5 className="font-medium text-gray-900">Informasi Bank</h5>
                        </div>
                        <div className="ml-10 space-y-2">
                          <div className="bg-white rounded-lg p-3">
                            <p className="font-medium text-gray-900">{transaction.bank_name}</p>
                            <p className="text-sm text-gray-600">{transaction.account_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-orange-600" />
                          </div>
                          <h5 className="font-medium text-gray-900">Detail Transaksi</h5>
                        </div>
                        <div className="ml-10 space-y-2">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Tanggal Transfer:</span> {formatDate(transaction.transfer_date)}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Status:</span> {transaction.status === 'pending' ? 'Menunggu Verifikasi' : transaction.status === 'verified' ? 'Terverifikasi' : 'Ditolak'}
                            </p>
                            {transaction.admin_notes && (
                              <p className="text-sm text-gray-700 mt-2">
                                <span className="font-medium">Catatan Admin:</span> {transaction.admin_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                      {transaction.proof_image_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="hover:bg-blue-500 hover:text-white"
                        >
                          <a 
                            href={transaction.proof_image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Bukti Transfer
                          </a>
                        </Button>
                      )}
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
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
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