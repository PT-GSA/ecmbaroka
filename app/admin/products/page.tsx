'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Package, 
  Plus, 
  Edit, 
  Eye, 
  Grid3X3, 
  List, 
  Search,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react'
import BulkDeleteDialog from '@/components/admin/bulk-delete-dialog'
import { Database } from '@/types/database'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Database['public']['Tables']['products']['Row'][]>([])
  const [filteredProducts, setFilteredProducts] = useState<Database['public']['Tables']['products']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      if (!res.ok) {
        console.error('Error fetching products')
        setProducts([])
      } else {
        const json = await res.json()
        const productsData: Database['public']['Tables']['products']['Row'][] = json?.products ?? []
        setProducts(productsData)
        setFilteredProducts(productsData)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
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

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
      if (typedProfile && typedProfile.role === 'admin') {
        setUser(user)
        setIsAdmin(true)
        fetchProducts()
      } else {
        setUser(user)
        setIsAdmin(false)
      }
    }

    checkAuth()

    // Realtime: refresh saat ada perubahan pada products
    const channel = supabase
      .channel('admin-products-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProducts, supabase])

  // Filter products based on search and status
  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product =>
        statusFilter === 'active' ? product.is_active : !product.is_active
      )
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter])

  // Auth guard checks
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Butuh Login</h1>
          <p className="text-gray-600 mb-6">Silakan login untuk mengakses halaman ini.</p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0)
  const lowStockProducts = products.filter(p => p.stock < 10).length

  async function handleBulkDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (deleting) return
    try {
      setDeleting(true)
      const form = e.currentTarget
      const fd = new FormData(form)
      const ids = fd.getAll('ids').filter((v): v is string => typeof v === 'string')
      if (!ids.length) {
        // no selection; nothing to delete
        return
      }
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) {
        console.error('Bulk delete failed')
        return
      }
      await fetchProducts()
    } catch (err) {
      console.error('Bulk delete error:', err)
    } finally {
      setDeleting(false)
    }
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
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Kelola Produk
                    </h1>
                    <p className="text-gray-600 text-lg">Mengelola katalog produk susu Baroka</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium">
                  <Package className="w-4 h-4 mr-2" />
                  Admin Panel
                </Badge>
                <Button asChild className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                  <Link href="/admin/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Produk
                  </Link>
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
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Produk</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                <p className="text-xs text-gray-500">Semua produk</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Produk Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
                <p className="text-xs text-gray-500">Tersedia untuk dijual</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-gray-500">Nilai inventori</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Stok Rendah</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
                <p className="text-xs text-gray-500">Perlu restock</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cari & Filter</h3>
                <p className="text-sm text-gray-600">Temukan produk yang Anda cari</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
              
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daftar Produk</h3>
                  <p className="text-sm text-gray-600">
                    Menampilkan {filteredProducts.length} dari {products.length} produk
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Mode: {viewMode === 'grid' ? 'Grid' : 'List'}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Memuat data...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Tidak Ada Produk yang Cocok' : 'Belum Ada Produk'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Coba ubah filter atau kata kunci pencarian' 
                    : 'Mulai dengan menambahkan produk pertama Anda'
                  }
                </p>
                <Button asChild className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                  <Link href="/admin/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Produk
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Bulk Delete Controls */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Pilih produk lalu klik &quot;Hapus Terpilih&quot;</p>
                    <BulkDeleteDialog formId="bulk-delete-form" />
                  </div>
                </div>

                {/* Products Display (wrapped in form for bulk delete) */}
                <form id="bulk-delete-form" onSubmit={handleBulkDelete}>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="group bg-gray-50 rounded-xl overflow-hidden hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                        <div className="relative aspect-square overflow-hidden bg-white">
                          {/* Checkbox */}
                          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow-sm">
                            <input
                              type="checkbox"
                              name="ids"
                              value={product.id}
                              className="h-4 w-4 align-middle"
                              aria-label={`Pilih ${product.name}`}
                            />
                          </div>
                          
                          {/* Product Image */}
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <Badge variant={product.is_active ? 'default' : 'destructive'} className="text-xs">
                              {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Stok: {product.stock}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Dibuat: {formatDate(product.created_at)}
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-blue-500 hover:text-white">
                              <Link href={`/admin/products/${product.id}`}>
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-green-500 hover:text-white">
                              <Link href={`/products/${product.id}`}>
                                <Eye className="mr-1 h-3 w-3" />
                                Lihat
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                        <div className="flex items-center gap-4">
                          {/* Checkbox */}
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              name="ids"
                              value={product.id}
                              className="h-4 w-4 align-middle"
                              aria-label={`Pilih ${product.name}`}
                            />
                          </div>
                          
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {product.name}
                              </h3>
                              <Badge variant={product.is_active ? 'default' : 'destructive'} className="text-xs">
                                {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </Badge>
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Stok: {product.stock}</span>
                              <span>Dibuat: {formatDate(product.created_at)}</span>
                            </div>
                          </div>
                          
                          {/* Price and Actions */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild className="hover:bg-blue-500 hover:text-white">
                                <Link href={`/admin/products/${product.id}`}>
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="hover:bg-green-500 hover:text-white">
                                <Link href={`/products/${product.id}`}>
                                  <Eye className="mr-1 h-3 w-3" />
                                  Lihat
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
