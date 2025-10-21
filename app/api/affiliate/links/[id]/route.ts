import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { 
      campaign?: string; 
      url_slug?: string; 
      active?: boolean 
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
    const service = createServiceClient()

    // Check if the link belongs to this affiliate
    const { data: existingLink } = await service
      .from('affiliate_links')
      .select('id, affiliate_id')
      .eq('id', id)
      .eq('affiliate_id', affiliateId)
      .maybeSingle()

    if (!existingLink) {
      return NextResponse.json({ error: 'Link tidak ditemukan atau tidak memiliki akses' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Database['public']['Tables']['affiliate_links']['Update'] = {}

    if (body.campaign !== undefined) {
      updateData.campaign = body.campaign.trim() || null
    }

    if (body.url_slug !== undefined) {
      const url_slug = slugify(body.url_slug)
      if (!url_slug) {
        return NextResponse.json({ error: 'Slug tidak valid' }, { status: 400 })
      }

      // Check if slug is already used by another link
      const { data: slugExists } = await service
        .from('affiliate_links')
        .select('id')
        .eq('url_slug', url_slug)
        .neq('id', id)
        .maybeSingle()

      if (slugExists) {
        return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 })
      }

      updateData.url_slug = url_slug
    }

    if (body.active !== undefined) {
      updateData.active = body.active
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await service
      .from('affiliate_links')
      // @ts-expect-error - Supabase client type issue with custom tables
      .update(updateData)
      .eq('id', id)
      .eq('affiliate_id', affiliateId)
      .select('id, affiliate_id, campaign, url_slug, active, created_at')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Gagal mengupdate link' }, { status: 500 })
    }

    return NextResponse.json({ link: updatedLink })
  } catch (e) {
    console.error('Affiliate link update error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const service = createServiceClient()

    // Check if the link belongs to this affiliate
    const { data: existingLink } = await service
      .from('affiliate_links')
      .select('id, affiliate_id')
      .eq('id', id)
      .eq('affiliate_id', affiliateId)
      .maybeSingle()

    if (!existingLink) {
      return NextResponse.json({ error: 'Link tidak ditemukan atau tidak memiliki akses' }, { status: 404 })
    }

    // Delete the link
    const { error: deleteError } = await service
      .from('affiliate_links')
      .delete()
      .eq('id', id)
      .eq('affiliate_id', affiliateId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Gagal menghapus link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Affiliate link delete error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}