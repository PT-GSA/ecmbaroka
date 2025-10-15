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

export async function POST(request: Request) {
  try {
    const service = createServiceClient()

    let ids: string[] = []

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null)
      if (body && Array.isArray(body.ids)) {
        ids = body.ids.filter((v: unknown) => typeof v === 'string')
      }
    } else {
      const form = await request.formData().catch(() => null)
      if (form) {
        ids = form.getAll('ids').filter((v): v is string => typeof v === 'string')
      }
    }

    if (!ids.length) {
      return NextResponse.json({ error: 'No product ids provided' }, { status: 400 })
    }

    const { error } = await service
      .from('products')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error deleting products:', error?.message || error)
      return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedIds: ids })
  } catch (error) {
    console.error('Error in admin products delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
