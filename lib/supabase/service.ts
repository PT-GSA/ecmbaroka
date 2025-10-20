import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseConfig } from './config'

export function createServiceClient() {
  const config = getSupabaseConfig()
  
  if (!config.isValid) {
    throw new Error('Supabase service configuration is missing. Please check your environment variables.')
  }

  return createClient<Database, 'public'>(config.url, config.serviceRoleKey)
}
