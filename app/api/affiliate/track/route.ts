import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug') || url.searchParams.get('link') || ''

  const service = createServiceClient()

  // If no slug provided, redirect to products
  if (!slug) {
    const res = NextResponse.redirect(new URL('/products', url.origin))
    return res
  }

  // Find affiliate link by slug (schema uses url_slug, active)
  const { data: rawLink, error: linkError } = await service
    .from('affiliate_links')
    .select('id, affiliate_id, campaign, url_slug, active')
    .eq('url_slug', slug)
    .maybeSingle()
  const link = rawLink as Database['public']['Tables']['affiliate_links']['Row'] | null

  // Fallback redirect if not found or inactive
  if (linkError || !link || !link.active) {
    const res = NextResponse.redirect(new URL('/products', url.origin))
    return res
  }

  // Record click with minimal info
  try {
    const ua = req.headers.get('user-agent') || ''
    const referer = req.headers.get('referer') || ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    // Hash IP to avoid storing raw IP
    const ipHash = await hashIp(ip)
    const uaHash = await hashIp(ua)

    const insertBuilder = service.from('affiliate_clicks') as unknown as {
      insert: (values: Database['public']['Tables']['affiliate_clicks']['Insert']) => Promise<{ error: unknown }>
    }
    await insertBuilder.insert({
      affiliate_id: link.affiliate_id,
      campaign: link.campaign ?? null,
      referrer: referer,
      ua_hash: uaHash,
      ip_hash: ipHash,
    })
  } catch (e) {
    // Non-blocking; proceed with redirect even if logging fails
    console.error('Affiliate click log error:', e)
  }

  // Set 30-day cookie for attribution
  // Redirect to products (no target_url in schema)
  const res = NextResponse.redirect(new URL('/products', url.origin))
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  res.cookies.set('afid', String(link.affiliate_id), {
    maxAge,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  })

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