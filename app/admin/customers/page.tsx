'use client'

import { useState, useEffect, useCallback } from 'react'
import { } from '@/components/ui/card'
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
  Trash2,
  Plus
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const supabase = createClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', phone: '', address: '' })
  const [editForm, setEditForm] = useState({ id: '', full_name: '', phone: '', address: '', email: '', password: '' })
  const [actionLoading, setActionLoading] = useState(false)

  type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
  type OrderRow = Database['public']['Tables']['orders']['Row']

  const loadCustomers = useCallback(async () => {
      setLoading(true)
      // Ambil semua profil customer
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, address, role, created_at')
        .eq('role', 'customer')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setCustomers([])
        setFilteredCustomers([])
        setLoading(false)
        return
      }

      const profiles = (profilesData ?? []) as UserProfileRow[]
      const userIds = profiles.map(p => p.id).filter((id): id is string => typeof id === 'string' && id.length > 0)

      // Ambil semua orders via admin API (service role) untuk melewati RLS
      let orders: OrderRow[] = []
      if (userIds.length > 0) {
        try {
          const res = await fetch('/api/admin/customers/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: userIds }),
          })
          if (!res.ok) {
            const errText = await res.text()
            console.error('Error fetching orders:', errText || `status ${res.status}`)
          } else {
            const json = await res.json()
            orders = (json.data ?? []) as OrderRow[]
          }
        } catch (e) {
          console.error('Error fetching orders:', (e as Error)?.message ?? e)
        }
      }

      // Buat map order per user
      const ordersMap = new Map<string, OrderRow[]>()
      userIds.forEach(uid => ordersMap.set(uid, []))
      orders.forEach(o => {
        const uid = o.user_id as string
        if (!ordersMap.has(uid)) ordersMap.set(uid, [])
        ordersMap.get(uid)!.push(o)
      })

      // Transform ke Customer
      const customersResult: Customer[] = profiles.map(p => {
        const uid = p.id as string
        const userOrders = ordersMap.get(uid) ?? []
        const totalOrders = userOrders.length
        const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
        const lastOrder = userOrders
          .map(o => o.created_at)
          .filter((d): d is string => typeof d === 'string' && d.length > 0)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

        const joinDate = (p.created_at as string) ?? new Date().toISOString()
        const lastOrderDate = lastOrder ?? joinDate

        const status: Customer['status'] = totalOrders > 0 ? 'active' : 'inactive'

        return {
          id: uid,
          name: p.full_name ?? 'Tanpa Nama',
          email: '', // Email tidak tersedia dari public schema
          phone: p.phone ?? '-',
          address: p.address ?? '-',
          joinDate,
          totalOrders,
          totalSpent,
          lastOrderDate,
          status,
          avatar: undefined,
        }
      })

      setCustomers(customersResult)
      setFilteredCustomers(customersResult)
      setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadCustomers()

    // Realtime: refresh saat ada perubahan pada user_profiles (customer saja) atau orders
    const profilesChannel = supabase
      .channel('admin-customers-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: 'role=eq.customer' },
        () => { loadCustomers() }
      )
      .subscribe()

    const ordersChannel = supabase
      .channel('admin-customers-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { loadCustomers() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
      supabase.removeChannel(ordersChannel)
    }
  }, [loadCustomers, supabase])

  useEffect(() => {
    let filtered = customers

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer =>
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
    setCurrentPage(1) // Reset to first page when filters change
  }, [customers, searchTerm, statusFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Manajemen Pelanggan
                    </h1>
                    <p className="text-gray-600 text-lg">Kelola data dan aktivitas pelanggan</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  Admin Panel
                </Badge>
                <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pelanggan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Pelanggan</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                <p className="text-xs text-gray-500">Semua pelanggan</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pelanggan Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
                <p className="text-xs text-gray-500">
                  {totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0}% dari total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500">Dari semua pelanggan</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">AOV</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(averageOrderValue)}</p>
                <p className="text-xs text-gray-500">Average Order Value</p>
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
              <p className="text-sm text-gray-600">Cari dan filter pelanggan</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari berdasarkan nama, email, atau nomor telepon..."
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
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daftar Pelanggan</h3>
                  <p className="text-sm text-gray-600">
                    Menampilkan {paginatedCustomers.length} dari {filteredCustomers.length} pelanggan
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
            ) : paginatedCustomers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada pelanggan ditemukan</h3>
                <p className="text-gray-600 mb-6">Belum ada pelanggan yang cocok dengan filter yang Anda pilih.</p>
                <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pelanggan Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedCustomers.map((customer) => (
                  <div key={customer.id} className="group bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg">{customer.name}</h4>
                            {getStatusBadge(customer.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{customer.email || 'Email tidak tersedia'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{customer.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>Bergabung: {formatDate(customer.joinDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="space-y-1">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{customer.totalOrders} pesanan</p>
                              <p className="text-xs text-gray-500">Terakhir: {formatDate(customer.lastOrderDate)}</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                              <p className="text-xs text-gray-500">Total belanja</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setEditForm({
                                id: customer.id,
                                full_name: customer.name,
                                phone: customer.phone === '-' ? '' : customer.phone,
                                address: customer.address === '-' ? '' : customer.address,
                                email: '',
                                password: ''
                              })
                              setEditOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredCustomers.length)} dari {filteredCustomers.length} pelanggan
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

      {/* Create Customer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan</DialogTitle>
            <DialogDescription>Masukkan data pelanggan baru.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input id="full_name" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input id="phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const res = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: createForm.email,
                      password: createForm.password,
                      full_name: createForm.full_name,
                      phone: createForm.phone || null,
                      address: createForm.address || null,
                    }),
                  })
                  if (!res.ok) throw new Error('Gagal membuat pelanggan')
                  setCreateOpen(false)
                  setCreateForm({ full_name: '', email: '', password: '', phone: '', address: '' })
                  await loadCustomers()
                } catch (err) {
                  console.error(err)
                } finally {
                  setActionLoading(false)
                }
              }}
              disabled={actionLoading}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pelanggan</DialogTitle>
            <DialogDescription>Perbarui data pelanggan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit_full_name">Nama Lengkap</Label>
              <Input id="edit_full_name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_email">Email (opsional)</Label>
                <Input id="edit_email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit_password">Password (opsional)</Label>
                <Input id="edit_password" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_phone">Nomor Telepon</Label>
              <Input id="edit_phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit_address">Alamat</Label>
              <Textarea id="edit_address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                if (!editForm.id) return
                try {
                  setActionLoading(true)
                  const payload: Record<string, unknown> = {
                    id: editForm.id,
                    full_name: editForm.full_name,
                    phone: editForm.phone || null,
                    address: editForm.address || null,
                  }
                  if (editForm.email) payload.email = editForm.email
                  if (editForm.password) payload.password = editForm.password
                  const res = await fetch('/api/customers', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                  if (!res.ok) throw new Error('Gagal memperbarui pelanggan')
                  setEditOpen(false)
                  await loadCustomers()
                } catch (err) {
                  console.error(err)
                } finally {
                  setActionLoading(false)
                }
              }}
              disabled={actionLoading}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pelanggan</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus akun dan data terkait pelanggan.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-gray-700">
            {selectedCustomer ? (
              <p>
                Anda yakin ingin menghapus <span className="font-semibold">{selectedCustomer.name}</span>?
              </p>
            ) : (
              <p>Pilih pelanggan terlebih dahulu.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selectedCustomer) return
                try {
                  setActionLoading(true)
                  const res = await fetch('/api/customers', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedCustomer.id }),
                  })
                  if (!res.ok) throw new Error('Gagal menghapus pelanggan')
                  setDeleteOpen(false)
                  setSelectedCustomer(null)
                  await loadCustomers()
                } catch (err) {
                  console.error(err)
                } finally {
                  setActionLoading(false)
                }
              }}
              disabled={actionLoading}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
