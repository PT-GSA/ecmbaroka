// Create an admin account using Supabase service role
// Usage: node scripts/create-admin.mjs [email] [password] [full_name]
// If omitted, a default email and random password will be used.

import { createClient } from '@supabase/supabase-js'

function getEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env ${name}. Please set it before running.`)
    process.exit(1)
  }
  return v
}

function randomPassword() {
  // 24-char strong password
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='
  let pwd = ''
  for (let i = 0; i < 24; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const emailArg = process.argv[2] || 'admin@ecmbaroka.test'
const passwordArg = process.argv[3] || randomPassword()
const fullNameArg = process.argv[4] || 'Admin ECM Baroka'

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('Creating admin user...')
  const { data: createdUser, error: createError } = await service.auth.admin.createUser({
    email: emailArg,
    password: passwordArg,
    email_confirm: true,
    user_metadata: { full_name: fullNameArg },
  })

  if (createError || !createdUser?.user) {
    console.error('Failed to create auth user:', createError?.message || 'Unknown error')
    process.exit(1)
  }

  const userId = createdUser.user.id
  console.log('Auth user created:', userId)

  // Upsert profile with admin role
  const { error: upsertError } = await service
    .from('user_profiles')
    .upsert({
      id: userId,
      full_name: fullNameArg,
      role: 'admin',
    }, { onConflict: 'id' })

  if (upsertError) {
    console.error('Failed to upsert profile:', upsertError.message)
    console.error('Rolling back: deleting auth user...')
    await service.auth.admin.deleteUser(userId)
    process.exit(1)
  }

  console.log('Admin profile set. You can now login:')
  console.log(`Email   : ${emailArg}`)
  console.log(`Password: ${passwordArg}`)
  console.log('Login URL: /admin-auth/login')
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})