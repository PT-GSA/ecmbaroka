import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // Early guard for missing service role key to avoid opaque 400s
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Konfigurasi server tidak lengkap', detail: 'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan' },
      { status: 500 }
    )
  }
  
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let actor = user
    if (!actor) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
      if (token) {
        const service = createServiceClient()
        const { data: userFromToken } = await service.auth.getUser(token)
        actor = userFromToken?.user ?? null
      }
    }

    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch (e) {
      return NextResponse.json({ error: 'FormData tidak bisa diparsing', detail: String(e) }, { status: 400 })
    }

    const orderId = (form.get('order_id') as string | null) || ''
    const bankName = (form.get('bank_name') as string | null) || ''
    const accountName = (form.get('account_name') as string | null) || ''
    const transferDate = (form.get('transfer_date') as string | null) || ''
    const amountRaw = (form.get('amount') as string | null) || ''
    const file = form.get('file') as File | null

    if (!orderId || !bankName || !accountName || !transferDate || !amountRaw || !file) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const amount = Number.parseFloat(amountRaw)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Nominal transfer tidak valid' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File tidak valid' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
    }

    const isImage = (file.type || '').startsWith('image/')
    if (!isImage) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    const service = createServiceClient()

    // Pastikan bucket ada (tidak error jika sudah ada)
    try {
      await service.storage.createBucket('payment-proofs', { public: false })
    } catch {}

    // Verifikasi pesanan milik user yang sedang login
    type OrderBasic = { id: string; user_id: string; status: Database['public']['Tables']['orders']['Row']['status'] }

    const { data: orderRowRaw, error: orderError } = await service
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      return NextResponse.json({ error: 'Gagal mengambil data pesanan' }, { status: 500 })
    }

    const orderRow = (orderRowRaw as OrderBasic | null)

    if (!orderRow || orderRow.user_id !== actor.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    const ext = (() => {
      const n = file.name.toLowerCase()
      const i = n.lastIndexOf('.')
      const m = i >= 0 ? n.substring(i + 1) : ''
      if (m) return m
      if (file.type === 'image/png') return 'png'
      if (file.type === 'image/jpeg') return 'jpg'
      return 'img'
    })()

    const path = `${actor.id}/${orderId}-${Date.now()}.${ext}`

    const { error: uploadError } = await service.storage
      .from('payment-proofs')
      .upload(path, file, { contentType: file.type || 'image/*' })

    if (uploadError) {
      const ue = (typeof uploadError === 'object' && uploadError !== null) ? (uploadError as { message?: string; name?: string; status?: number }) : null
      const msg = ue?.message ?? String(uploadError)
      const status = ue?.status
      const name = ue?.name
      const nameStr = typeof name === 'string' ? name : undefined
      return NextResponse.json(
        { error: 'Upload gagal', detail: msg, status, name: nameStr },
        { status: 400 }
      )
    }

    const { data: urlData } = service.storage.from('payment-proofs').getPublicUrl(path)
    const proofUrl = urlData.publicUrl

    const insertPayload: Database['public']['Tables']['payments']['Insert'] = {
      order_id: orderId,
      proof_image_url: proofUrl,
      bank_name: bankName,
      account_name: accountName,
      transfer_date: transferDate,
      amount,
      status: 'pending',
    }

    // Use a typed builder to avoid Supabase generics inference issues
    const insertBuilder = service.from('payments') as unknown as {
      insert: (
        values: Database['public']['Tables']['payments']['Insert']
      ) => {
        select: (columns?: string) => {
          single: () => Promise<{
            data: Pick<Database['public']['Tables']['payments']['Row'], 'id'> | null
            error: unknown
          }>
        }
      }
    }

    const { data: paymentInsert, error: paymentError } = await insertBuilder
      .insert(insertPayload)
      .select('id')
      .single()

    if (paymentError) {
      const paymentDetail = String((paymentError as { message?: unknown })?.message ?? paymentError)
      return NextResponse.json({ error: 'Gagal menyimpan data pembayaran', detail: paymentDetail }, { status: 500 })
    }

    const updateBuilder = service.from('orders') as unknown as {
      update: (
        values: Database['public']['Tables']['orders']['Update']
      ) => { eq: (column: string, value: string) => Promise<{ error: unknown }> }
    }

    const { error: updateError } = await updateBuilder
      .update({ status: 'paid' })
      .eq('id', orderId)

    if (updateError) {
      const updateDetail = String((updateError as { message?: unknown })?.message ?? updateError)
      return NextResponse.json({ error: 'Gagal memperbarui status pesanan', detail: updateDetail }, { status: 500 })
    }

    return NextResponse.json({ ok: true, proof_url: proofUrl, payment_id: paymentInsert?.id ?? null })
  } catch (e) {
    return NextResponse.json({ error: 'Unhandled error', detail: String(e) }, { status: 500 })
  }
}