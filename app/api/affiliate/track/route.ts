import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug') || url.searchParams.get('link') || ''
  const code = url.searchParams.get('aff') || ''
  const to = url.searchParams.get('to') || '/products'

  const service = createServiceClient()

  // If neither slug nor code provided, redirect to products
  if (!slug && !code) {
    const res = NextResponse.redirect(new URL('/products', url.origin))
    return res
  }

  // Resolve affiliate either by link slug or affiliate code
  let affiliateId: string | null = null
  let affiliateLinkId: string | null = null
  let campaign: string | null = null

  if (slug) {
    // Find affiliate link by slug (schema uses url_slug, active)
    const { data: rawLink, error: linkError } = await service
      .from('affiliate_links')
      .select('id, affiliate_id, campaign, url_slug, active')
      .eq('url_slug', slug)
      .maybeSingle()
    const link = rawLink as Database['public']['Tables']['affiliate_links']['Row'] | null
    if (linkError || !link || !link.active) {
      const res = NextResponse.redirect(new URL('/products', url.origin))
      return res
    }
    affiliateId = link.affiliate_id
    affiliateLinkId = link.id
    campaign = link.campaign ?? null
  } else if (code) {
    // Find affiliate by code (must be active)
    const { data: aff, error: affErr } = await service
      .from('affiliates')
      .select('id, status')
      .eq('code', code)
      .maybeSingle()
    const affiliate = aff as Database['public']['Tables']['affiliates']['Row'] | null
    if (affErr || !affiliate || affiliate.status !== 'active') {
      const res = NextResponse.redirect(new URL('/products', url.origin))
      return res
    }
    affiliateId = affiliate.id
    affiliateLinkId = null
    campaign = null
  }

  // Record click with time-based deduplication (per day)
  try {
    const ua = req.headers.get('user-agent') || ''
    const referer = req.headers.get('referer') || ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    const ipHash = await hashIp(ip)
    const uaHash = await hashIp(ua)
    
    // Check if click already exists today for this combination
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const { data: existingClick } = await service
      .from('affiliate_clicks')
      .select('id')
      .eq('affiliate_id', affiliateId!)
      .eq('ua_hash', uaHash)
      .eq('ip_hash', ipHash)
      .gte('clicked_at', `${today}T00:00:00.000Z`)
      .lt('clicked_at', `${today}T23:59:59.999Z`)
      .maybeSingle()

    if (!existingClick) {
      // Insert new click if no click exists today
      const insertBuilder = service.from('affiliate_clicks') as unknown as {
        insert: (values: Database['public']['Tables']['affiliate_clicks']['Insert']) => Promise<{ error: unknown }>
      }
      await insertBuilder.insert({
        affiliate_id: affiliateId!,
        campaign,
        referrer: referer,
        ua_hash: uaHash,
        ip_hash: ipHash,
      })
    }
  } catch (e) {
    console.error('Affiliate click log error:', e)
  }

  // Set 30-day cookie for attribution and redirect
  const res = NextResponse.redirect(new URL(to, url.origin))
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  if (affiliateId) {
    res.cookies.set('afid', String(affiliateId), {
      maxAge,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    })
  }
  if (affiliateLinkId) {
    res.cookies.set('aflid', String(affiliateLinkId), {
      maxAge,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return res
}

async function hashIp(ip: string): Promise<string> {
  try {
    if (!ip) return ''
    const encoder = new TextEncoder()
    const data = encoder.encode(ip)
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(digest))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  } catch {
    return ''
  }
}