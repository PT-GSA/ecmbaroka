import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import NotificationItem from '@/components/customer/notification-item'
import type { Database } from '@/types/database'

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
      // Map 'system' and any unknown to 'product' for a neutral bell icon
      return 'product'
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, type, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Gracefully handle fetch errors without noisy console output
  const safeNotifications = (error ? [] : (notifications ?? [])) as unknown as NotificationRow[]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Notifikasi</CardTitle>
          <CardDescription>
            Pemberitahuan terbaru untuk akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {safeNotifications && safeNotifications.length > 0 ? (
            safeNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={mapTypeToComponent(n.type)}
                title={n.title}
                message={n.message}
                link={n.link ?? undefined}
                isRead={!!n.is_read}
                createdAt={n.created_at}
              />
            ))
          ) : (
            <p className="text-gray-500">Belum ada notifikasi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}