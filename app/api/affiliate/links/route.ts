import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { campaign?: string; url_slug?: string }
    const campaign = (body.campaign || '').trim()
    const rawSlug = body.url_slug || campaign
    const url_slug = slugify(rawSlug)

    if (!url_slug) {
      return NextResponse.json({ error: 'Slug tidak valid' }, { status: 400 })
    }

    // Ensure the user is an active affiliate
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      return NextResponse.json({ error: 'Akun bukan affiliate aktif' }, { status: 403 })
    }

    // Safely narrow the affiliate type for usage below
    const affiliateId = (affiliate as { id: string }).id

    const service = createServiceClient()

    // Enforce global uniqueness on url_slug to avoid ambiguous tracking
    const { data: existing } = await service
      .from('affiliate_links')
      .select('id')
      .eq('url_slug', url_slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 })
    }

    const { data: inserted, error: insertError } = await service
      .from('affiliate_links')
      // @ts-expect-error - Supabase type inference issue with service role client
      .insert({
        affiliate_id: affiliateId,
        campaign: campaign || null,
        url_slug,
        active: true,
      })
      .select('id, affiliate_id, campaign, url_slug, active, created_at')
      .maybeSingle()

    if (insertError) {
      return NextResponse.json({ error: 'Gagal membuat link' }, { status: 500 })
    }

    return NextResponse.json({ link: inserted }, { status: 201 })
  } catch (e) {
    console.error('Affiliate link create error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}