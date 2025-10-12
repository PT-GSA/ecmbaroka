'use client'

import { useState, useEffect } from 'react'
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
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface Payment {
  id: string
  orderId: string
  customerName: string
  amount: number
  method: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data untuk demo
    const mockPayments: Payment[] = [
      {
        id: 'PAY001',
        orderId: 'SB001',
        customerName: 'John Doe',
        amount: 25000,
        method: 'Bank Transfer',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:35:00Z'
      },
      {
        id: 'PAY002',
        orderId: 'SB002',
        customerName: 'Jane Smith',
        amount: 15000,
        method: 'Bank Transfer',
        status: 'pending',
        createdAt: '2024-01-15T11:15:00Z',
        updatedAt: '2024-01-15T11:15:00Z'
      },
      {
        id: 'PAY003',
        orderId: 'SB003',
        customerName: 'Bob Johnson',
        amount: 35000,
        method: 'Bank Transfer',
        status: 'failed',
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:05:00Z'
      },
      {
        id: 'PAY004',
        orderId: 'SB004',
        customerName: 'Alice Brown',
        amount: 20000,
        method: 'Bank Transfer',
        status: 'refunded',
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-15T09:10:00Z'
      },
      {
        id: 'PAY005',
        orderId: 'SB005',
        customerName: 'Charlie Wilson',
        amount: 45000,
        method: 'Bank Transfer',
        status: 'completed',
        createdAt: '2024-01-15T13:45:00Z',
        updatedAt: '2024-01-15T13:50:00Z'
      }
    ]

    setPayments(mockPayments)
    setFilteredPayments(mockPayments)
    setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = payments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
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

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800'
    }

    const labels = {
      completed: 'Selesai',
      pending: 'Pending',
      failed: 'Gagal',
      refunded: 'Refund'
    }

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'refunded':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedAmount = payments
    .filter(p => p.status === 'completed')
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
            <CardTitle className="text-sm font-medium">Pembayaran Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(completedAmount)}</div>
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
              {payments.length > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0}%
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
                <option value="completed">Selesai</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
                <option value="refunded">Refund</option>
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
                        <p className="text-sm text-gray-600">Order: {payment.orderId}</p>
                      </div>
                      <p className="text-sm text-gray-500">{payment.customerName}</p>
                      <p className="text-xs text-gray-400">
                        {payment.method} • {formatDate(payment.createdAt)}
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
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                            Reject
                          </Button>
                        </>
                      )}
                      {payment.status === 'completed' && (
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          Refund
                        </Button>
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
