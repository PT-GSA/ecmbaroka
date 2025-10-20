import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getServerSupabaseConfig } from './server-config'

export function createServiceClient() {
  const { url, serviceRoleKey, isValid } = getServerSupabaseConfig()
  
  if (!isValid) {
    throw new Error('Supabase service configuration is missing. Please check your environment variables.')
  }

  return createClient<Database, 'public'>(url!, serviceRoleKey!)
}
