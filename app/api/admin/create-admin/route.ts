import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

type Body = {
  email?: string
  password?: string
  full_name?: string
}

function isBody(v: unknown): v is Body {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  return (
    (typeof b.email === 'string' || typeof b.email === 'undefined') &&
    (typeof b.password === 'string' || typeof b.password === 'undefined') &&
    (typeof b.full_name === 'string' || typeof b.full_name === 'undefined')
  )
}

function genPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='
  let pwd = ''
  for (let i = 0; i < 24; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export async function POST(req: NextRequest) {
  try {
    const bodyRaw: unknown = await req.json().catch(() => ({}))
    if (!isBody(bodyRaw)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const email = bodyRaw.email || 'admin@ecmbaroka.test'
    const password = bodyRaw.password || genPassword()
    const full_name = bodyRaw.full_name || 'Admin ECM Baroka'

    const service = createServiceClient()

    const { data: createdUser, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!createdUser?.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    const userId = createdUser.user.id

    const profileInsert: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: userId,
      full_name,
      role: 'admin',
    }

    const upsertBuilder = service.from('user_profiles') as unknown as {
      upsert: (values: Database['public']['Tables']['user_profiles']['Insert']) => Promise<{ error: unknown }>
    }
    const { error: upsertError } = await upsertBuilder.upsert(profileInsert)

    if (upsertError) {
      // rollback: delete created auth user
      await service.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to set admin profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId, email, password }, { status: 200 })
  } catch (e) {
    console.error('Create admin error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}