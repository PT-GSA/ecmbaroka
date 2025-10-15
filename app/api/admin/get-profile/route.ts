import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const { userId } = (await req.json().catch(() => ({}))) as { userId?: string }
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('user_profiles' as keyof Database['public']['Tables'])
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ profile: data }, { status: 200 })
  } catch (e) {
    console.error('get-profile error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}