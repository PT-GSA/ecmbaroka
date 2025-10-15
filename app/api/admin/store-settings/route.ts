import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface StoreSettings {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  bankName: string
  accountNumber: string
  accountName: string
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Susu Baroka',
  storeAddress: 'Jl. Merdeka No. 123, Jakarta Selatan',
  storePhone: '+62 812-3456-7890',
  storeEmail: 'info@susubaroka.com',
  bankName: 'BCA',
  accountNumber: '1234567890',
  accountName: 'Susu Baroka',
}

async function ensureAdmin(req: NextRequest): Promise<{ ok: true } | { ok: false; redirect: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, redirect: NextResponse.redirect(new URL('/admin-auth/login', req.url)) }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = (profile as { role?: string } | null)?.role
  if (role !== 'admin') return { ok: false, redirect: NextResponse.redirect(new URL('/', req.url)) }
  return { ok: true }
}

export async function GET(req: NextRequest) {
  const adminCheck = await ensureAdmin(req)
  if (!('ok' in adminCheck) || adminCheck.ok === false) return adminCheck.redirect

  const service = createServiceClient()

  // Pastikan bucket tersedia (abaikan error jika sudah ada)
  try {
    await service.storage.createBucket('app-config', { public: false })
  } catch {}

  try {
    const { data, error } = await service.storage
      .from('app-config')
      .download('store-settings.json')
    if (error || !data) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    // Supabase JS v2 mengembalikan Blob di browser, dan ReadableStream/ArrayBuffer di Node.
    let text = ''
    const anyData = data as unknown as { text?: () => Promise<string>; arrayBuffer?: () => Promise<ArrayBuffer> }
    if (typeof anyData.text === 'function') {
      text = await anyData.text()
    } else if (typeof anyData.arrayBuffer === 'function') {
      const buf = await anyData.arrayBuffer()
      text = Buffer.from(buf).toString('utf-8')
    } else {
      // Fallback
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    try {
      const parsed = JSON.parse(text) as Partial<StoreSettings>
      const settings: StoreSettings = {
        storeName: parsed.storeName || DEFAULT_SETTINGS.storeName,
        storeAddress: parsed.storeAddress || DEFAULT_SETTINGS.storeAddress,
        storePhone: parsed.storePhone || DEFAULT_SETTINGS.storePhone,
        storeEmail: parsed.storeEmail || DEFAULT_SETTINGS.storeEmail,
        bankName: parsed.bankName || DEFAULT_SETTINGS.bankName,
        accountNumber: parsed.accountNumber || DEFAULT_SETTINGS.accountNumber,
        accountName: parsed.accountName || DEFAULT_SETTINGS.accountName,
      }
      return NextResponse.json({ settings })
    } catch {
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }
  } catch (e) {
    console.error('Failed to load store settings:', e)
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await ensureAdmin(req)
  if (!('ok' in adminCheck) || adminCheck.ok === false) return adminCheck.redirect

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Partial<StoreSettings>
  const settings: StoreSettings = {
    storeName: (b.storeName || '').trim() || DEFAULT_SETTINGS.storeName,
    storeAddress: (b.storeAddress || '').trim() || DEFAULT_SETTINGS.storeAddress,
    storePhone: (b.storePhone || '').trim() || DEFAULT_SETTINGS.storePhone,
    storeEmail: (b.storeEmail || '').trim() || DEFAULT_SETTINGS.storeEmail,
    bankName: (b.bankName || '').trim() || DEFAULT_SETTINGS.bankName,
    accountNumber: (b.accountNumber || '').trim() || DEFAULT_SETTINGS.accountNumber,
    accountName: (b.accountName || '').trim() || DEFAULT_SETTINGS.accountName,
  }

  const service = createServiceClient()
  try {
    await service.storage.createBucket('app-config', { public: false })
  } catch {}

  try {
    const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' })
    const { error } = await service.storage
      .from('app-config')
      .upload('store-settings.json', blob, { upsert: true, contentType: 'application/json' })
    if (error) {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
    return NextResponse.json({ success: true, settings })
  } catch (e) {
    console.error('Failed to save store settings:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}