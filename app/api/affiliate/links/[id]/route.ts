import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const linkId = url.searchParams.get('id')

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 })
    }

    // Ensure the user is an active affiliate
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      return NextResponse.json({ error: 'Akun bukan affiliate aktif' }, { status: 403 })
    }

    const affiliateId = (affiliate as { id: string }).id

    // Check if the link belongs to this affiliate
    const { data: existingLink } = await supabase
      .from('affiliate_links')
      .select('id, affiliate_id')
      .eq('id', linkId)
      .eq('affiliate_id', affiliateId)
      .maybeSingle()

    if (!existingLink) {
      return NextResponse.json({ error: 'Link tidak ditemukan atau tidak memiliki akses' }, { status: 404 })
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('id', linkId)
      .eq('affiliate_id', affiliateId)

    if (deleteError) {
      return NextResponse.json({ error: 'Gagal menghapus link' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Link berhasil dihapus' }, { status: 200 })
  } catch (e) {
    console.error('Affiliate link delete error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}