import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { cookies } from 'next/headers'
import { getServerSupabaseConfig } from './server-config'

export async function createClient() {
  const { url, anonKey } = getServerSupabaseConfig()

  if (!url || !anonKey) {
    throw new Error('Supabase server configuration is missing. Please check your environment variables.')
  }

  const cookieStore = await cookies()

  return createServerClient<Database, 'public'>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}