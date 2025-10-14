import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

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

export async function POST(req: NextRequest) {
  const adminCheck = await ensureAdmin(req)
  if (!('ok' in adminCheck) || adminCheck.ok === false) return adminCheck.redirect

  const form = await req.formData()
  const email = (form.get('email') as string | null)?.trim() || ''
  const code = (form.get('code') as string | null)?.trim() || ''
  const name = (form.get('name') as string | null)?.trim() || null
  const visibility = (form.get('visibility_level') as string | null) || 'basic'
  const status = (form.get('status') as string | null) || 'active'

  if (!email || !code) {
    return NextResponse.redirect(new URL('/admin/affiliates/new?error=missing_fields', req.url))
  }

  const service = createServiceClient()
  // Find user by email via admin API
  let userId: string | null = null
  try {
    const { data: userList } = await service.auth.admin.listUsers({ page: 1, perPage: 200 })
    const found = userList.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    userId = found?.id ?? null
  } catch {
    return NextResponse.redirect(new URL('/admin/affiliates/new?error=user_lookup_failed', req.url))
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/admin/affiliates/new?error=user_not_found', req.url))
  }

  const insertValues: Database['public']['Tables']['affiliates']['Insert'] = {
    user_id: userId,
    code,
    name: name ?? undefined,
    email,
    status: status as Database['public']['Tables']['affiliates']['Row']['status'],
    visibility_level: visibility as Database['public']['Tables']['affiliates']['Row']['visibility_level'],
  }

  // Work around TS generics inference issues by using a typed builder
  const insertBuilder = service.from('affiliates') as unknown as {
    insert: (
      values: Database['public']['Tables']['affiliates']['Insert']
    ) => Promise<{ error: unknown }>
  }
  const { error } = await insertBuilder.insert(insertValues)
  if (error) {
    return NextResponse.redirect(new URL('/admin/affiliates/new?error=create_failed', req.url))
  }

  return NextResponse.redirect(new URL('/admin/affiliates?success=created', req.url))
}

export async function GET(req: NextRequest) {
  const adminCheck = await ensureAdmin(req)
  if (!('ok' in adminCheck) || adminCheck.ok === false) return adminCheck.redirect

  const service = createServiceClient()
  const { data: affiliates, error: affErr } = await service
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: links, error: linksErr } = await service
    .from('affiliate_links')
    .select('*')
    .order('created_at', { ascending: false })

  if (affErr || linksErr) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  return NextResponse.json({
    affiliates: (Array.isArray(affiliates) ? affiliates : []) as Database['public']['Tables']['affiliates']['Row'][],
    links: (Array.isArray(links) ? links : []) as Database['public']['Tables']['affiliate_links']['Row'][],
  })
}