import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; linkId: string }> }
) {
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

  const { id, linkId } = await context.params
  if (!id || !linkId) {
    return NextResponse.redirect(new URL('/admin/affiliates?error=missing_id', req.url))
  }

  const service = createServiceClient()
  const { error } = await service
    .from('affiliate_links')
    .delete()
    .eq('id', linkId)
    .eq('affiliate_id', id)

  if (error) {
    return NextResponse.redirect(new URL('/admin/affiliates?error=delete_failed', req.url))
  }

  return NextResponse.redirect(new URL('/admin/affiliates?success=link_deleted', req.url))
}