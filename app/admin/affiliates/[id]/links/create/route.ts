import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/admin-auth/login', req.url))

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
  if (!typedProfile || typedProfile.role !== 'admin') return NextResponse.redirect(new URL('/', req.url))

  const { id } = await context.params
  const formData = await req.formData()
  const campaign = (formData.get('campaign') as string | null) ?? null
  const url_slug = (formData.get('url_slug') as string | null) || ''

  if (!url_slug) {
    return NextResponse.redirect(new URL(`/admin/affiliates?error=invalid`, req.url))
  }

  const service = createServiceClient()
  const insertBuilder = service.from('affiliate_links') as unknown as {
    insert: (values: Database['public']['Tables']['affiliate_links']['Insert']) => Promise<{ error: unknown }>
  }
  const { error } = await insertBuilder.insert({
    affiliate_id: id,
    campaign,
    url_slug,
    active: true,
  })

  if (error) {
    return NextResponse.redirect(new URL(`/admin/affiliates?error=create_failed`, req.url))
  }

  return NextResponse.redirect(new URL(`/admin/affiliates?success=1`, req.url))
}