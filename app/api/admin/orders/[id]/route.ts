import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
    image_url: string | null
  }
}

interface OrderResponse {
  id: string
  order_code?: string | null
  created_at: string
  status: string
  total_amount: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  order_items: OrderItem[]
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
  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
  if (!typedProfile || typedProfile.role !== 'admin') {
    return { ok: false, redirect: NextResponse.redirect(new URL('/', req.url)) }
  }
  return { ok: true }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminCheck = await ensureAdmin(req)
  if (!('ok' in adminCheck) || adminCheck.ok === false) return adminCheck.redirect

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch order with items and product info
  const orderRes = await service
    .from('orders')
    .select(`
      id,
      order_code,
      created_at,
      status,
      total_amount,
      shipping_address,
      phone,
      user_id,
      order_items (
        id,
        quantity,
        price_at_purchase,
        products (
          name,
          image_url
        )
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (orderRes.error || !orderRes.data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  type OrderRowLite = Pick<Database['public']['Tables']['orders']['Row'],
    'id' | 'order_code' | 'created_at' | 'status' | 'total_amount' | 'shipping_address' | 'phone' | 'user_id'
  >
  type OrderItemRowLite = Pick<Database['public']['Tables']['order_items']['Row'], 'id' | 'quantity' | 'price_at_purchase'>
  type ProductLite = Pick<Database['public']['Tables']['products']['Row'], 'name' | 'image_url'>
  // Supabase nested relation for a 1:N may return array; accept both and normalize later
  type OrderItemJoined = OrderItemRowLite & { products: ProductLite | ProductLite[] }
  type OrderJoined = OrderRowLite & { order_items: OrderItemJoined[] }

  const o = orderRes.data as OrderJoined

  // Fetch customer profile
  const profileRes = await service
    .from('user_profiles')
    .select('full_name, phone')
    .eq('id', o.user_id)
    .maybeSingle()
  const profile = profileRes.data as Pick<Database['public']['Tables']['user_profiles']['Row'], 'full_name' | 'phone'> | null

  // Fetch customer email via admin API
  let customerEmail = ''
  try {
    const { data: userList } = await service.auth.admin.listUsers({ page: 1, perPage: 200 })
    const found = userList.users.find((u: { id: string; email?: string }) => u.id === o.user_id)
    customerEmail = found?.email ?? ''
  } catch {
    customerEmail = ''
  }

  const order: OrderResponse = {
    id: o.id,
    order_code: o.order_code ?? null,
    created_at: o.created_at,
    status: o.status,
    total_amount: Number(o.total_amount),
    customer_name: profile?.full_name ?? 'Customer',
    customer_email: customerEmail,
    customer_phone: (o.phone ?? profile?.phone ?? '') ?? '',
    customer_address: o.shipping_address ?? '',
    order_items: (o.order_items ?? []).map(oi => {
      const product = Array.isArray(oi.products) ? oi.products[0] : oi.products
      return {
        id: oi.id,
        quantity: oi.quantity,
        price_at_purchase: Number(oi.price_at_purchase),
        products: {
          name: product?.name ?? 'Produk',
          image_url: product?.image_url ?? null,
        },
      }
    }),
  }

  return NextResponse.json({ order })
}