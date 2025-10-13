import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

type Body = {
  orderId: string
  status: 'verified' | 'rejected'
  adminNotes?: string | null
}

function isBody(v: unknown): v is Body {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  return (
    typeof b.orderId === 'string' &&
    (b.status === 'verified' || b.status === 'rejected')
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pastikan user adalah admin
    type UserProfileRole = Pick<Database['public']['Tables']['user_profiles']['Row'], 'role'>
    const profileRes = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const profile = profileRes.data as UserProfileRole | null

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: unknown = await req.json()
    if (!isBody(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { orderId, status, adminNotes } = body

    // Ambil user_id pemilik order
    type OrderLite = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'user_id'>
    const orderRes = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .maybeSingle()
    const order = orderRes.data as OrderLite | null

    if (orderRes.error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const service = createServiceClient()

    const title = status === 'verified' ? 'Pembayaran Terverifikasi' : 'Pembayaran Ditolak'
    const message = status === 'verified'
      ? 'Pembayaran Anda telah diverifikasi. Pesanan akan diproses.'
      : `Pembayaran ditolak${adminNotes ? `: ${adminNotes}` : ''}. Silakan unggah ulang bukti atau hubungi admin.`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const link = `${appUrl}/customer-orders/${orderId}`

    type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
    type NotificationRow = Database['public']['Tables']['notifications']['Row']
    const newNotification: NotificationInsert = {
      user_id: order.user_id,
      title,
      message,
      type: 'payment',
      link,
      is_read: false,
    }

    const insertBuilder = service.from('notifications') as unknown as {
      insert: (
        values: NotificationInsert
      ) => {
        select: () => {
          single: () => Promise<{
            data: NotificationRow | null
            error: unknown
          }>
        }
      }
    }

    const { error: insertError } = await insertBuilder
      .insert(newNotification)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}