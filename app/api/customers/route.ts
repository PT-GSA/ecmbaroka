import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

type CreateBody = {
  email: string
  password: string
  full_name: string
  phone?: string | null
  address?: string | null
}

type UpdateBody = {
  id: string
  full_name?: string
  phone?: string | null
  address?: string | null
  email?: string
  password?: string
}

type DeleteBody = {
  id: string
}

function isCreateBody(v: unknown): v is CreateBody {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  return (
    typeof b.email === 'string' &&
    typeof b.password === 'string' &&
    typeof b.full_name === 'string'
  )
}

function isUpdateBody(v: unknown): v is UpdateBody {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  return (
    typeof b.id === 'string' &&
    (typeof b.full_name === 'string' || typeof b.full_name === 'undefined') &&
    (typeof b.phone === 'string' || b.phone === null || typeof b.phone === 'undefined') &&
    (typeof b.address === 'string' || b.address === null || typeof b.address === 'undefined') &&
    (typeof b.email === 'string' || typeof b.email === 'undefined') &&
    (typeof b.password === 'string' || typeof b.password === 'undefined')
  )
}

function isDeleteBody(v: unknown): v is DeleteBody {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  return typeof b.id === 'string'
}

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { status: 401 as const, error: 'Unauthorized' }
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || (profile as Database['public']['Tables']['user_profiles']['Row']).role !== 'admin') {
    return { status: 403 as const, error: 'Forbidden' }
  }
  return { status: 200 as const }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await ensureAdmin()
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body: unknown = await req.json()
    if (!isCreateBody(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { email, password, full_name, phone = null, address = null } = body
    const service = createServiceClient()

    // Create auth user
    const { data: createdUser, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (createError || !createdUser?.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    // Insert profile
    const newProfile: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: createdUser.user.id,
      full_name,
      phone,
      address,
      role: 'customer',
    }

    const insertBuilder = service.from('user_profiles') as unknown as {
      insert: (
        values: Database['public']['Tables']['user_profiles']['Insert']
      ) => {
        select: () => {
          single: () => Promise<{
            data: Database['public']['Tables']['user_profiles']['Row'] | null
            error: unknown
          }>
        }
      }
    }

    const { error: profileError } = await insertBuilder.insert(newProfile).select().single()
    if (profileError) {
      // rollback: delete created auth user
      await service.auth.admin.deleteUser(createdUser.user.id)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: createdUser.user.id })
  } catch (e) {
    console.error('Error creating customer:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await ensureAdmin()
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body: unknown = await req.json()
    if (!isUpdateBody(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { id, full_name, phone, address, email, password } = body
    const service = createServiceClient()

    // Update profile
    const updateProfile: Database['public']['Tables']['user_profiles']['Update'] = {
      full_name,
      phone,
      address,
    }
    // Gunakan builder bertipe untuk menghindari masalah tipe generik Supabase
    const updateBuilder = service.from('user_profiles') as unknown as {
      update: (
        values: Database['public']['Tables']['user_profiles']['Update']
      ) => {
        eq: (
          column: 'id',
          value: string
        ) => Promise<{
          error: unknown
        }>
      }
    }

    const { error: upError } = await updateBuilder
      .update(updateProfile)
      .eq('id', id)

    if (upError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Optionally update auth email/password
    if (email || password) {
      const { error: adminUpdateError } = await service.auth.admin.updateUserById(id, {
        email,
        password,
      })
      if (adminUpdateError) {
        return NextResponse.json({ error: 'Failed to update auth user' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error updating customer:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await ensureAdmin()
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body: unknown = await req.json()
    if (!isDeleteBody(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { id } = body
    const service = createServiceClient()

    const { error: delError } = await service.auth.admin.deleteUser(id)
    if (delError) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error deleting customer:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}