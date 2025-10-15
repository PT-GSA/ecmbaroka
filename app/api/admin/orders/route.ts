import { createServiceClient } from '@/lib/supabase/service'
import { Database } from '@/types/database'
import { NextResponse } from 'next/server'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
    price: number
  }
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  shipping_address: string
  phone?: string
  notes?: string
  user_id: string
  user_profiles?: {
    full_name: string
    phone: string
  }
  order_items: OrderItem[]
}

type UserProfileLite = Pick<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'full_name' | 'phone'>

export async function GET() {
  try {
    const service = createServiceClient()
    
    const ordersQuery = await service
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        shipping_address,
        phone,
        notes,
        user_id,
        order_items (
          id,
          quantity,
          price_at_purchase,
          products (
            name,
            price
          )
        )
      `)
      .order('created_at', { ascending: false })

    const { data: ordersData, error } = ordersQuery
    if (error) {
      console.error('Error fetching orders:', error?.message || error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    const rawOrders = (ordersData ?? []) as unknown as (Database['public']['Tables']['orders']['Row'] & {
      order_items: (Database['public']['Tables']['order_items']['Row'] & {
        products: Pick<Database['public']['Tables']['products']['Row'], 'name' | 'price'>
      })[]
    })[]

    const userIds: string[] = Array.from(
      new Set(
        rawOrders
          .map(o => o.user_id)
          .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0)
      )
    )
    
    const profileMap = new Map<string, { full_name: string; phone: string | null }>()
    if (userIds.length > 0) {
      const profileRes = await service
        .from('user_profiles')
        .select('id, full_name, phone')
        .in('id', userIds)
      const profileError = profileRes.error
      const profiles = (profileRes.data ?? []) as UserProfileLite[]
      if (profileError) {
        console.error('Error fetching profiles:', profileError?.message || profileError)
      }
      profiles.forEach((p) => {
        profileMap.set(p.id, { full_name: p.full_name ?? '', phone: p.phone ?? null })
      })
    }

    const orders: Order[] = rawOrders.map(o => ({
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      total_amount: Number(o.total_amount),
      shipping_address: o.shipping_address,
      phone: o.phone ?? undefined,
      notes: o.notes ?? undefined,
      user_id: o.user_id,
      user_profiles: profileMap.has(o.user_id) ? {
        full_name: profileMap.get(o.user_id)!.full_name,
        phone: profileMap.get(o.user_id)!.phone ?? ''
      } : undefined,
      order_items: o.order_items.map(oi => ({
        id: oi.id,
        quantity: oi.quantity,
        price_at_purchase: Number(oi.price_at_purchase),
        products: {
          name: oi.products?.name ?? 'Produk',
          price: Number(oi.products?.price ?? oi.price_at_purchase)
        }
      }))
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error in admin orders API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
