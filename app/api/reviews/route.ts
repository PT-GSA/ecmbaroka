import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Anda harus login untuk memberikan review' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, rating, comment } = body

    // Validate input
    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus antara 1-5' },
        { status: 400 }
      )
    }

    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Komentar minimal 10 karakter' },
        { status: 400 }
      )
    }

    if (comment.trim().length > 500) {
      return NextResponse.json(
        { error: 'Komentar maksimal 500 karakter' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'Anda sudah memberikan review untuk produk ini' },
        { status: 400 }
      )
    }

    // Check if user has purchased this product (for verified purchase)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        id,
        orders!inner(
          id,
          user_id,
          status
        )
      `)
      .eq('product_id', productId)
      .eq('orders.user_id', user.id)
      .in('orders.status', ['completed', 'shipped'])

    const verifiedPurchase = orderItems && orderItems.length > 0

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim(),
        verified_purchase: verifiedPurchase,
        is_approved: true // Auto-approve for now, can be changed to false for moderation
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting review:', insertError)
      return NextResponse.json(
        { error: 'Gagal menyimpan review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Review berhasil dikirim'
    })

  } catch (error) {
    console.error('Error in review API:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
