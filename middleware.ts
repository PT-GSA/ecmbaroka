import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Affiliate tracking: catch ?slug / ?link and redirect to tracking route
  try {
    const url = request.nextUrl
    // Only trigger tracking when a valid slug/link is present.
    // "aff" (affiliate code) alone should not trigger tracking.
    const slugParam = url.searchParams.get('slug') || url.searchParams.get('link')
    const isTrackingRoute = url.pathname.startsWith('/api/affiliate/track')
    if (slugParam && !isTrackingRoute) {
      // Build destination without the affiliate params
      const cleanUrl = new URL(url.origin + url.pathname)
      const paramsToKeep = new URLSearchParams(url.searchParams)
      paramsToKeep.delete('aff')
      paramsToKeep.delete('slug')
      paramsToKeep.delete('link')
      const queryStr = paramsToKeep.toString()
      if (queryStr) cleanUrl.search = queryStr

      const trackUrl = new URL(`/api/affiliate/track`, url.origin)
      trackUrl.searchParams.set('slug', slugParam)
      trackUrl.searchParams.set('to', cleanUrl.pathname + (cleanUrl.search || ''))
      return NextResponse.redirect(trackUrl)
    }
  } catch {}

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip redirect for admin login page
    if (request.nextUrl.pathname === '/admin-auth/login') {
      return supabaseResponse
    }
    
    if (!user) {
      return NextResponse.redirect(new URL('/admin-auth/login', request.url))
    }

    // Check if user is admin with RLS-safe fallback
    let role: string | null = null
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (!error) {
        role = profile?.role ?? null
      }
    } catch {}

    // Fallback: use service role to bypass RLS issues (e.g., recursive policies causing 500)
    if (!role) {
      try {
        const service = createServiceClient()
        const { data: svcProfile } = await service
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        role = svcProfile?.role ?? null
      } catch {}
    }

    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protected customer routes
  if (
      request.nextUrl.pathname.startsWith('/customer-orders') ||
      request.nextUrl.pathname.startsWith('/cart') ||
      request.nextUrl.pathname.startsWith('/checkout') ||
      request.nextUrl.pathname.startsWith('/orders') ||
      request.nextUrl.pathname.startsWith('/profile') ||
      request.nextUrl.pathname.startsWith('/transaction-history') ||
      request.nextUrl.pathname.startsWith('/notifications')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }


  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/affiliate/login')) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (request.nextUrl.pathname === '/affiliate/login') {
        // If visiting affiliate login and already authenticated, send active affiliates to their dashboard
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (affiliate) {
          return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
        }
        // Not an affiliate: send to home
        return NextResponse.redirect(new URL('/', request.url))
      } else {
        if (profile?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    } catch {
      // If profile doesn't exist yet, allow access to auth pages
      // This can happen during signup process
    }
  }

  // Guard affiliate dashboard: require login
  if (request.nextUrl.pathname.startsWith('/affiliate/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/affiliate/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
