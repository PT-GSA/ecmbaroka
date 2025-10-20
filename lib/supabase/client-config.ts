export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Basic sanity check: avoid obvious misconfig (pointing to same-site path without domain)
  // Allow both direct self-host domain and proxied via app domain
  return {
    url,
    anonKey,
  }
}