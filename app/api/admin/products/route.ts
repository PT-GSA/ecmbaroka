import { createServiceClient } from '@/lib/supabase/service'
import { Database } from '@/types/database'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const service = createServiceClient()
    
    const { data, error } = await service
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error?.message || error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const products = data as Database['public']['Tables']['products']['Row'][] | null

    return NextResponse.json({ products: products ?? [] })
  } catch (error) {
    console.error('Error in admin products API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
