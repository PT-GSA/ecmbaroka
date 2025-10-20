import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

export function createClient() {
  const config = getSupabaseConfig()

  if (!config.url || !config.anonKey) {
    throw new Error('Supabase client configuration is missing. Please check your environment variables.')
  }

  return createBrowserClient(config.url, config.anonKey)
}
