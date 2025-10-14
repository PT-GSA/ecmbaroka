import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import type { PostgrestError } from '@supabase/supabase-js'

async function ensureAdmin(req: NextRequest): Promise<{ ok: true } | { ok: false; redirect: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, redirect: NextResponse.redirect(new URL('/admin-auth/login', req.url)) }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
  if (!typedProfile || typedProfile.role !== 'admin') {
    return { ok: false, redirect: NextResponse.redirect(new URL('/', req.url)) }
  }
  return { ok: true }
}

export async function GET(req: NextRequest) {
  const adminCheck = await ensureAdmin(req)
  if (!('ok' in adminCheck) || adminCheck.ok === false) return adminCheck.redirect

  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').map(s => s.trim()).filter(s => s.length > 0)

  if (ids.length === 0) {
    return NextResponse.json({ data: [] }, { status: 200 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('orders')
    .select('id, user_id, created_at, total_amount')
    .in('user_id', ids)

  if (error) {
    const pgError = error as PostgrestError
    return NextResponse.json({ error: pgError?.message ?? 'Unknown error' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}