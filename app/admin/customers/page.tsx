'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  joinDate: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  status: 'active' | 'inactive' | 'suspended'
  avatar?: string
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data untuk demo
    const mockCustomers: Customer[] = [
      {
        id: 'CUST001',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+62 812-3456-7890',
        address: 'Jl. Sudirman No. 123, Jakarta Selatan',
        joinDate: '2024-01-10',
        totalOrders: 15,
        totalSpent: 450000,
        lastOrderDate: '2024-01-15',
        status: 'active'
      },
      {
        id: 'CUST002',
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+62 813-4567-8901',
        address: 'Jl. Thamrin No. 456, Jakarta Pusat',
        joinDate: '2024-01-05',
        totalOrders: 8,
        totalSpent: 280000,
        lastOrderDate: '2024-01-14',
        status: 'active'
      },
      {
        id: 'CUST003',
        name: 'Bob Johnson',
        email: 'bob.johnson@email.com',
        phone: '+62 814-5678-9012',
        address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
        joinDate: '2023-12-20',
        totalOrders: 3,
        totalSpent: 95000,
        lastOrderDate: '2024-01-08',
        status: 'inactive'
      },
      {
        id: 'CUST004',
        name: 'Alice Brown',
        email: 'alice.brown@email.com',
        phone: '+62 815-6789-0123',
        address: 'Jl. Kebon Jeruk No. 321, Jakarta Barat',
        joinDate: '2024-01-12',
        totalOrders: 22,
        totalSpent: 680000,
        lastOrderDate: '2024-01-15',
        status: 'active'
      },
      {
        id: 'CUST005',
        name: 'Charlie Wilson',
        email: 'charlie.wilson@email.com',
        phone: '+62 816-7890-1234',
        address: 'Jl. Senayan No. 654, Jakarta Selatan',
        joinDate: '2023-11-15',
        totalOrders: 1,
        totalSpent: 25000,
        lastOrderDate: '2023-12-01',
        status: 'suspended'
      },
      {
        id: 'CUST006',
        name: 'Diana Lee',
        email: 'diana.lee@email.com',
        phone: '+62 817-8901-2345',
        address: 'Jl. Pondok Indah No. 987, Jakarta Selatan',
        joinDate: '2024-01-08',
        totalOrders: 12,
        totalSpent: 380000,
        lastOrderDate: '2024-01-13',
        status: 'active'
      }
    ]

    setCustomers(mockCustomers)
    setFilteredCustomers(mockCustomers)
    setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = customers

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, statusFilter])

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
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    }

    const labels = {
      active: 'Aktif',
      inactive: 'Tidak Aktif',
      suspended: 'Ditangguhkan'
    }

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0)
  const averageOrderValue = customers.length > 0 ? totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) : 0

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Pelanggan
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola data dan aktivitas pelanggan
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Users className="w-4 h-4 mr-1" />
          Admin Panel
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Semua pelanggan
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Dari semua pelanggan
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AOV</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Average Order Value
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
                  placeholder="Cari berdasarkan ID, nama, email, atau nomor telepon..."
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
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggan</CardTitle>
          <CardDescription>
            {filteredCustomers.length} dari {customers.length} pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data pelanggan yang ditemukan
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{customer.name}</p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-600">{customer.id}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">{customer.address}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">Bergabung: {formatDate(customer.joinDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium">{customer.totalOrders} pesanan</p>
                          <p className="text-xs text-gray-500">Terakhir: {formatDate(customer.lastOrderDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{formatCurrency(customer.totalSpent)}</p>
                          <p className="text-xs text-gray-500">Total belanja</p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(customer.status)}
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
