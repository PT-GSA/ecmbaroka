"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NotificationItem from '@/components/customer/notification-item'
import type { Database } from '@/types/database'
import { Loader2 } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})

  const PAGE_SIZE = 10

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>
                Pemberitahuan terbaru untuk akun Anda
              </CardDescription>
            </div>
            <div className="mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={bulkLoading || notifications.every((n) => !!n.is_read)}
              >
                {bulkLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Tandai semua sebagai dibaca
                  </span>
                ) : (
                  'Tandai semua sebagai dibaca'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Memuat notifikasi...</p>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((n) => (
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
            ))
          ) : (
            <p className="text-gray-500">Belum ada notifikasi.</p>
          )}

          {!loading && hasMore && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
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
        </CardContent>
      </Card>
    </div>
  )
}