'use client'

import { useState, useEffect, useCallback } from 'react'
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
  }, [customers, searchTerm, statusFilter])

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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Users className="w-4 h-4 mr-1" />
            Admin Panel
          </Badge>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pelanggan
          </Button>
        </div>
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
                  placeholder="Cari berdasarkan nama, email, atau nomor telepon..."
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
  )
}
