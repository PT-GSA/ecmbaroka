// Debug Middleware - Temporary
// Ganti middleware.ts dengan ini untuk debug

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware triggered for:', request.nextUrl.pathname)
  
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

  console.log('👤 User:', user ? `${user.email} (${user.id})` : 'Not logged in')

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('🔒 Admin route accessed')
    
    if (!user) {
      console.log('❌ No user, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('👨‍💼 Profile:', profile, 'Error:', error)

    if (!profile || profile.role !== 'admin') {
      console.log('❌ Not admin, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    console.log('✅ Admin access granted')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
