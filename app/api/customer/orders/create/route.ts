import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

type CreateOrderBody = {
  items: Array<{ product_id: string; quantity: number; price_at_purchase?: number }>
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

const isCreateOrderBody = (b: unknown): b is CreateOrderBody => {
  if (!b || typeof b !== 'object') return false
  const obj = b as Record<string, unknown>
  const items = obj.items
  if (!Array.isArray(items) || items.length === 0) return false
  for (const it of items) {
    if (!it || typeof it !== 'object') return false
    const itObj = it as Record<string, unknown>
    if (typeof itObj.product_id !== 'string') return false
    if (typeof itObj.quantity !== 'number' || !Number.isInteger(itObj.quantity) || itObj.quantity <= 0) return false
    // price_at_purchase optional; ignored on server and replaced by DB price
  }
  return true
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Service role client may be unavailable in production if env not set
    let service: ReturnType<typeof createServiceClient> | null = null
    let serviceAvailable = false
    try {
      service = createServiceClient()
      serviceAvailable = true
    } catch (e) {
      console.warn('Service role unavailable, using user client fallback:', e)
    }

    const body: unknown = await req.json()
    if (!isCreateOrderBody(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { items, shipping_address, phone, notes } = body as CreateOrderBody
    const sanitizedShipping = (shipping_address && shipping_address.trim().slice(0, 500)) || '-'
    const sanitizedPhone = (phone && phone.replace(/[^\d+]/g, '').slice(0, 20)) || '-'

    // Disallow duplicate products in a single order
    {
      const seen = new Set<string>()
      for (const it of items) {
        if (seen.has(it.product_id)) {
          return NextResponse.json({ error: 'Duplikasi produk pada items tidak diperbolehkan' }, { status: 400 })
        }
        seen.add(it.product_id)
      }
    }

    // Enforce minimum quantity 5 cartons per item
    for (const it of items) {
      if (it.quantity < 5) {
        return NextResponse.json({ error: 'Minimal order adalah 5 karton per produk' }, { status: 400 })
      }
    }

    // Compute totals server-side to ensure integrity
    let totalAmount = 0

    // Read affiliate cookies if present
    const affiliateId = req.cookies.get('afid')?.value ?? null
    const affiliateLinkId = req.cookies.get('aflid')?.value ?? null

    // Build date parts for order code
    const { yearFull, yearShort, month, day } = getJakartaDateParts()
    const ymdFull = `${yearFull}${month}${day}`

    // Rate limit: max 3 orders per user per minute
    const sinceIso = new Date(Date.now() - 60_000).toISOString()
    const rateClient = serviceAvailable ? service! : supabase
    const { count: recentOrdersCount, error: recentErr } = await rateClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('created_at', sinceIso)
    if (!recentErr && (recentOrdersCount ?? 0) >= 3) {
      return NextResponse.json({ error: 'Terlalu banyak order, coba lagi nanti' }, { status: 429 })
    }

    // Validate affiliate cookies to avoid foreign key violations
    let validAffiliateId: string | null = affiliateId
    let validAffiliateLinkId: string | null = affiliateLinkId
    if (serviceAvailable) {
      try {
        if (affiliateId) {
          const { data: aff } = await service!
            .from('affiliates')
            .select('id')
            .eq('id', affiliateId)
            .maybeSingle()
          if (!aff) validAffiliateId = null
        }
        if (affiliateLinkId) {
          const { data: link } = await service!
            .from('affiliate_links')
            .select('id')
            .eq('id', affiliateLinkId)
            .maybeSingle()
          if (!link) validAffiliateLinkId = null
        }
      } catch (e) {
        console.warn('Affiliate validation skipped due to error:', e)
        validAffiliateId = null
        validAffiliateLinkId = null
      }
    } else {
      // Without service role, skip validation to avoid RLS issues and FK errors
      validAffiliateId = null
      validAffiliateLinkId = null
    }

    // Generate order code using daily counter (prefer RPC if service available)
    let orderCode = ''
    if (serviceAvailable) {
      try {
        // Use direct RPC call with type assertion
        const rpcClient = service!.rpc
        // @ts-expect-error - Supabase RPC type issue
        let rpcRes = await rpcClient('next_order_counter', { p_date_ymd: ymdFull })
        if (rpcRes.error) {
          // @ts-expect-error - Supabase RPC type issue
          rpcRes = await rpcClient('next_order_counter', { date_ymd: ymdFull })
        }
        const nextCounter = Number(rpcRes.data ?? 0)
        if (!rpcRes.error && nextCounter > 0) {
          orderCode = `${yearShort}${month}${day}${String(nextCounter).padStart(4, '0')}`
        }
      } catch (e) {
        console.error('next_order_counter RPC failed:', e)
      }
    }
    if (!orderCode) {
      // Fallback: generate unique code with random 4-digit suffix and verify uniqueness
      const base = `${yearShort}${month}${day}`
      let attempt = 0
      let unique = ''
      const checkClient = serviceAvailable ? service! : supabase
      while (attempt < 10) {
        const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        unique = `${base}${suffix}`
        const existsRes = await checkClient
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

    // Fetch product prices from DB and compute order items + total safely
    const uniqueProductIds = Array.from(new Set(items.map((it) => it.product_id)))
    const readClient = serviceAvailable ? service! : supabase
    const { data: products, error: productsErr } = await readClient
      .from('products')
      .select('id, price, is_active')
      .in('id', uniqueProductIds)
    if (productsErr) {
      console.error('Products fetch error:', productsErr)
      return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
    }
    if (!products || products.length !== uniqueProductIds.length) {
      return NextResponse.json({ error: 'Produk tidak valid atau tidak aktif' }, { status: 400 })
    }
    const productsAny = products as Array<{ id: string; price: number | string; is_active: boolean }>
    for (const p of productsAny) {
      if (!p.is_active) {
        return NextResponse.json({ error: 'Terdapat produk yang tidak aktif' }, { status: 400 })
      }
    }
    const priceMap = new Map(productsAny.map((p) => {
      const price = Number(p.price)
      // Round to 2 decimal places to avoid precision issues
      const roundedPrice = Math.round(price * 100) / 100
      return [p.id, roundedPrice]
    }))
    const computedOrderItems = items.map((it) => {
      const price = Number(priceMap.get(it.product_id) ?? 0)
      // Round price to 2 decimal places to avoid precision issues
      const roundedPrice = Math.round(price * 100) / 100
      return {
        order_id: orderId,
        product_id: it.product_id,
        quantity: it.quantity,
        price_at_purchase: roundedPrice,
      }
    })
    if (computedOrderItems.some((oi) => oi.price_at_purchase <= 0)) {
      return NextResponse.json({ error: 'Harga produk tidak valid' }, { status: 400 })
    }
    totalAmount = computedOrderItems.reduce((sum, oi) => sum + (oi.price_at_purchase * oi.quantity), 0)
    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Total order tidak valid' }, { status: 400 })
    }
    
    // Check for numeric overflow (max 99,999,999.99)
    if (totalAmount > 99999999.99) {
      return NextResponse.json({ error: 'Total order terlalu besar' }, { status: 400 })
    }
    
    // Round to 2 decimal places to avoid precision issues
    totalAmount = Math.round(totalAmount * 100) / 100

    // Insert order
    type OrderInsert = Database['public']['Tables']['orders']['Insert']
    const insertOrder: OrderInsert = {
      id: orderId,
      user_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: sanitizedShipping,
      phone: sanitizedPhone,
      notes: notes ?? null,
      order_code: orderCode,
    }
    if (validAffiliateId) insertOrder.affiliate_id = validAffiliateId
    if (validAffiliateLinkId) insertOrder.affiliate_link_id = validAffiliateLinkId

    const writeClient = serviceAvailable ? service! : supabase
    const insertOrderBuilder = writeClient.from('orders') as unknown as {
      insert: (values: OrderInsert) => Promise<{ error: unknown }>
    }

    let { error: orderErr } = await insertOrderBuilder.insert(insertOrder)
    if (orderErr) {
      console.error('Order insert error:', orderErr)
      const isDupCode = typeof (orderErr as { message?: string }).message === 'string' && /idx_orders_order_code|unique/i.test((orderErr as { message?: string }).message as string)
      if (isDupCode) {
        const base = `${yearShort}${month}${day}`
        const newSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        orderCode = `${base}${newSuffix}`
        insertOrder.order_code = orderCode
        const retry = await insertOrderBuilder.insert(insertOrder)
        orderErr = retry.error ?? null
      }

      const errMsg = (orderErr as { message?: string }).message || ''
      const errCode = (orderErr as { code?: string }).code || ''
      if (orderErr && errCode === 'PGRST204') {
        if (/affiliate_link_id/i.test(errMsg) && validAffiliateId) {
          const insertOrderOnlyAff: OrderInsert = {
            id: insertOrder.id!,
            user_id: insertOrder.user_id!,
            total_amount: insertOrder.total_amount!,
            status: insertOrder.status ?? 'pending',
            shipping_address: insertOrder.shipping_address!,
            phone: insertOrder.phone!,
            notes: insertOrder.notes ?? null,
            order_code: insertOrder.order_code ?? null,
            affiliate_id: validAffiliateId,
          }
          const retryOnlyAff = await insertOrderBuilder.insert(insertOrderOnlyAff)
          orderErr = retryOnlyAff.error ?? null
        }
        if (orderErr && /affiliate_id/i.test(((orderErr as { message?: string }).message || ''))) {
          const insertOrderNoAff: OrderInsert = {
            id: insertOrder.id!,
            user_id: insertOrder.user_id!,
            total_amount: insertOrder.total_amount!,
            status: insertOrder.status ?? 'pending',
            shipping_address: insertOrder.shipping_address!,
            phone: insertOrder.phone!,
            notes: insertOrder.notes ?? null,
            order_code: insertOrder.order_code ?? null,
          }
          const retryNoAff = await insertOrderBuilder.insert(insertOrderNoAff)
          orderErr = retryNoAff.error ?? null
        }
      }
      if (orderErr) {
        const errPayload = {
          error: 'Failed to create order',
          code: (orderErr as { code?: string }).code ?? undefined,
          details: (orderErr as { message?: string }).message ?? undefined,
        }
        return NextResponse.json(errPayload, { status: 500 })
      }
    }

    // Insert order items
    type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
    const orderItems: OrderItemInsert[] = computedOrderItems

    const insertItemsBuilder = writeClient.from('order_items') as unknown as {
      insert: (values: OrderItemInsert[]) => Promise<{ error: unknown }>
    }

    const { error: itemsErr } = await insertItemsBuilder.insert(orderItems)
    if (itemsErr) {
      // Cleanup: avoid orphaned order if items failed to insert (ignore errors under RLS)
      try {
        await writeClient.from('orders').delete().eq('id', orderId)
      } catch {}
      return NextResponse.json({ error: 'Failed to add order items' }, { status: 500 })
    }

    return NextResponse.json({ orderId, orderCode }, { status: 200 })
  } catch (e) {
    console.error('Create order error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}