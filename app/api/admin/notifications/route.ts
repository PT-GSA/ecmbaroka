import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function ensureAdmin(): Promise<{ ok: true } | { ok: false; redirect: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, redirect: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile as { role: string }).role !== 'admin') {
    return { ok: false, redirect: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { ok: true }
}

export async function GET(req: NextRequest) {
  const adminCheck = await ensureAdmin()
  if (!adminCheck.ok) return adminCheck.redirect

  try {
    const service = createServiceClient()
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get admin notifications
    const { data: notifications, error } = await service
      .from('notifications')
      .select('*')
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching admin notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get total count
    const { count } = await service
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'withdrawal')

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await ensureAdmin()
  if (!adminCheck.ok) return adminCheck.redirect

  try {
    const body = await req.json()
    const { title, message, type = 'admin', link } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = createServiceClient()
    
    // Create admin notification (without user_id for global admin notifications)
    const { error: insertError } = await service
      .from('notifications')
      // @ts-expect-error - Supabase client type issue with custom tables
      .insert({
        title,
        message,
        type,
        link: link || null,
        is_read: false,
        user_id: null // Global admin notification
      })

    if (insertError) {
      console.error('Notification creation error:', insertError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification created successfully' 
    })

  } catch (error) {
    console.error('Admin notification creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
