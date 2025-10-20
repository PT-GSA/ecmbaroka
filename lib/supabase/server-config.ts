export function getServerSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isValid = Boolean(url && anonKey && serviceRoleKey)

  return {
    url,
    anonKey,
    serviceRoleKey,
    isValid,
  }
}