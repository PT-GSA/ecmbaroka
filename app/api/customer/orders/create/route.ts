import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

type CreateOrderBody = {
  items: Array<{ product_id: string; quantity: number; price_at_purchase: number }>
  shipping_address?: string
  phone?: string
  notes?: string
}

function getJakartaDateParts() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const yearFull = (parts.find((p) => p.type === 'year')?.value ?? `${now.getFullYear()}`)
  const yearShort = yearFull.slice(-2)
  const month = (parts.find((p) => p.type === 'month')?.value ?? `${now.getMonth() + 1}`.padStart(2, '0'))
  const day = (parts.find((p) => p.type === 'day')?.value ?? `${now.getDate()}`.padStart(2, '0'))
  return { yearFull, yearShort, month, day }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: unknown = await req.json()
    const isCreateOrderBody = (b: unknown): b is CreateOrderBody => {
      if (!b || typeof b !== 'object') return false
      const obj = b as Record<string, unknown>
      const items = obj.items
      if (!Array.isArray(items) || items.length === 0) return false
      for (const it of items) {
        if (!it || typeof it !== 'object') return false
        const itObj = it as Record<string, unknown>
        if (typeof itObj.product_id !== 'string') return false
        if (typeof itObj.quantity !== 'number') return false
        if (typeof itObj.price_at_purchase !== 'number') return false
      }
      return true
    }
    if (!isCreateOrderBody(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { items, shipping_address, phone, notes } = body as CreateOrderBody
    // Enforce minimum quantity 5 cartons per item
    for (const it of items) {
      if (it.quantity < 5) {
        return NextResponse.json({ error: 'Minimal order adalah 5 karton per produk' }, { status: 400 })
      }
    }

    // Read affiliate cookies if present
    const affiliateId = req.cookies.get('afid')?.value ?? null
    const affiliateLinkId = req.cookies.get('aflid')?.value ?? null

    // Compute totals server-side to ensure integrity
    const totalAmount = items.reduce((sum, it) => sum + (Number(it.price_at_purchase) * Number(it.quantity)), 0)

    // Generate order code using daily counter
    const { yearFull, yearShort, month, day } = getJakartaDateParts()
    const ymdFull = `${yearFull}${month}${day}`

    const service = createServiceClient()
    // Prefer the updated function signature with p_date_ymd first
    let rpcRes = await service.rpc('next_order_counter', { p_date_ymd: ymdFull })
    // If the older signature is still deployed, fallback to date_ymd
    if (rpcRes.error) {
      rpcRes = await service.rpc('next_order_counter', { date_ymd: ymdFull })
    }
    let orderCode = ''
    const nextCounter = Number(rpcRes.data ?? 0)
    if (!rpcRes.error && nextCounter > 0) {
      orderCode = `${yearShort}${month}${day}${String(nextCounter).padStart(4, '0')}`
    } else {
      console.error('next_order_counter RPC failed or returned invalid:', rpcRes.error)
      // Fallback: generate unique code with random 4-digit suffix and verify uniqueness
      const base = `${yearShort}${month}${day}`
      let attempt = 0
      let unique = ''
      while (attempt < 10) {
        const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        unique = `${base}${suffix}`
        const existsRes = await service
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('order_code', unique)
          .range(0, 0)
        const exists = (existsRes.count ?? 0) > 0
        if (!exists) break
        attempt += 1
      }
      if (attempt >= 10) {
        return NextResponse.json({ error: 'Failed to generate order code' }, { status: 500 })
      }
      orderCode = unique
    }
    const orderId = crypto.randomUUID()

    // Insert order
    type OrderInsert = Database['public']['Tables']['orders']['Insert']
    const insertOrder: OrderInsert = {
      id: orderId,
      user_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: (shipping_address && shipping_address.trim()) || '-',
      phone: (phone && phone.trim()) || '-',
      notes: notes ?? null,
      order_code: orderCode,
      // created_at is default
      affiliate_id: affiliateId ?? undefined,
      affiliate_link_id: affiliateLinkId ?? undefined,
    }

    let { error: orderErr } = await service.from('orders').insert(insertOrder)
    if (orderErr) {
      const isDupCode = typeof orderErr?.message === 'string' && /idx_orders_order_code|unique/i.test(orderErr.message)
      if (isDupCode) {
        // Try once more with a new random code
        const base = `${yearShort}${month}${day}`
        const newSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        orderCode = `${base}${newSuffix}`
        insertOrder.order_code = orderCode
        const retry = await service.from('orders').insert(insertOrder)
        orderErr = retry.error ?? null
      }
      if (orderErr) {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
      }
    }

    // Insert order items
    type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
    const orderItems: OrderItemInsert[] = items.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      price_at_purchase: it.price_at_purchase,
    }))
    const { error: itemsErr } = await service.from('order_items').insert(orderItems)
    if (itemsErr) {
      return NextResponse.json({ error: 'Failed to add order items' }, { status: 500 })
    }

    return NextResponse.json({ orderId, orderCode }, { status: 200 })
  } catch (e) {
    console.error('Create order error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}