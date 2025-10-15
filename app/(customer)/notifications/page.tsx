"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import NotificationItem from '@/components/customer/notification-item'
import type { Database } from '@/types/database'
import { 
  Loader2, 
  Bell, 
  BellRing, 
  CheckCircle, 
  Clock,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

function mapTypeToComponent(t: NotificationRow['type']): 'order_status' | 'payment' | 'product' | 'review' {
  switch (t) {
    case 'order':
      return 'order_status'
    case 'payment':
      return 'payment'
    case 'review':
      return 'review'
    default:
      return 'product'
  }
}

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const PAGE_SIZE = 10

  // Filter notifications based on selected filter
  useEffect(() => {
    let filtered = notifications
    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.is_read)
    } else if (filter === 'read') {
      filtered = notifications.filter(n => n.is_read)
    }
    setFilteredNotifications(filtered)
    setCurrentPage(1) // Reset to first page when filter changes
  }, [notifications, filter])

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex)

  // Calculate stats
  const totalNotifications = notifications.length
  const unreadNotifications = notifications.filter(n => !n.is_read).length
  const readNotifications = notifications.filter(n => n.is_read).length

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, type, link, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1)

      const initial = error ? [] : (data ?? [])
      setNotifications(initial)
      setHasMore((initial?.length ?? 0) === PAGE_SIZE)
      setLoading(false)
    }
    init()
  }, [supabase, router])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as NotificationRow
            setNotifications((prev) => [row, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as NotificationRow
            setNotifications((prev) => prev.map((n) => (n.id === row.id ? row : n)))
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as NotificationRow
            setNotifications((prev) => prev.filter((n) => n.id !== row.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const handleMarkAsRead = async (id: string) => {
    setLoadingIds((prev) => ({ ...prev, [id]: true }))
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }
    setLoadingIds((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return
    setBulkLoading(true)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
    setBulkLoading(false)
  }

  const loadMore = async () => {
    if (!userId || loadingMore) return
    setLoadingMore(true)
    const start = notifications.length
    const end = start + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, type, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(start, end)

    const more = error ? [] : (data ?? [])
    setNotifications((prev) => [...prev, ...more])
    setHasMore(more.length === PAGE_SIZE)
    setLoadingMore(false)
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
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Notifikasi
                    </h1>
                    <p className="text-gray-600 text-lg">Pemberitahuan terbaru untuk akun Anda</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium">
                  <BellRing className="w-4 h-4 mr-2" />
                  Customer Panel
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={bulkLoading || notifications.every((n) => !!n.is_read)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                >
                  {bulkLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Tandai semua sebagai dibaca
                    </span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Tandai semua sebagai dibaca
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Notifikasi</p>
                <p className="text-2xl font-bold text-gray-900">{totalNotifications}</p>
                <p className="text-xs text-gray-500">Semua notifikasi</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Belum Dibaca</p>
                <p className="text-2xl font-bold text-yellow-600">{unreadNotifications}</p>
                <p className="text-xs text-gray-500">Menunggu untuk dibaca</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Sudah Dibaca</p>
                <p className="text-2xl font-bold text-green-600">{readNotifications}</p>
                <p className="text-xs text-gray-500">Notifikasi yang sudah dibaca</p>
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
              <h3 className="text-lg font-semibold text-gray-900">Filter Notifikasi</h3>
              <p className="text-sm text-gray-600">Pilih jenis notifikasi yang ingin ditampilkan</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            >
              Semua ({totalNotifications})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={filter === 'unread' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : ''}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Belum Dibaca ({unreadNotifications})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
              className={filter === 'read' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
            >
              <Eye className="w-4 h-4 mr-2" />
              Sudah Dibaca ({readNotifications})
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daftar Notifikasi</h3>
                  <p className="text-sm text-gray-600">
                    Menampilkan {paginatedNotifications.length} dari {filteredNotifications.length} notifikasi
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
                <span className="ml-3 text-gray-600">Memuat notifikasi...</span>
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filter === 'all' ? 'Belum Ada Notifikasi' : 
                   filter === 'unread' ? 'Tidak Ada Notifikasi Belum Dibaca' : 
                   'Tidak Ada Notifikasi Sudah Dibaca'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' ? 'Anda belum memiliki notifikasi.' : 
                   filter === 'unread' ? 'Semua notifikasi sudah dibaca.' : 
                   'Belum ada notifikasi yang sudah dibaca.'}
                </p>
                {filter !== 'all' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setFilter('all')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  >
                    Lihat Semua Notifikasi
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    type={mapTypeToComponent(n.type)}
                    title={n.title}
                    message={n.message}
                    link={n.link ?? undefined}
                    isRead={!!n.is_read}
                    createdAt={n.created_at}
                    onMarkAsRead={handleMarkAsRead}
                    loading={!!loadingIds[n.id]}
                  />
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
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredNotifications.length)} dari {filteredNotifications.length} notifikasi
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

        {/* Load More Button (for backward compatibility) */}
        {!loading && hasMore && filteredNotifications.length >= PAGE_SIZE && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat...
                </span>
              ) : (
                'Muat lebih banyak'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}