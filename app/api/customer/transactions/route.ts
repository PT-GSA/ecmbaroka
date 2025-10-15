import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user payments/transactions
    type PaymentRow = Database['public']['Tables']['payments']['Row']

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        order_id,
        bank_name,
        account_name,
        transfer_date,
        amount,
        status,
        proof_image_url,
        admin_notes,
        created_at
      `)
      .eq('user_id', user.id)
      .returns<PaymentRow[]>()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const transactions = (payments ?? []).map((p) => ({
      id: p.id,
      order_id: p.order_id,
      bank_name: p.bank_name,
      account_name: p.account_name,
      transfer_date: p.transfer_date,
      amount: p.amount,
      status: p.status,
      proof_image_url: p.proof_image_url ?? undefined,
      admin_notes: p.admin_notes ?? undefined,
      created_at: p.created_at,
    }))

    // Generate signed URLs for proof images
    const extractPathFromPublicUrl = (url: string) => {
      try {
        const pathname = new URL(url).pathname
        const marker = '/payment-proofs/'
        const idx = pathname.indexOf(marker)
        if (idx === -1) return null
        return pathname.substring(idx + marker.length)
      } catch {
        return null
      }
    }

    let transactionsWithSignedUrls = transactions
    if (transactions.length > 0) {
      transactionsWithSignedUrls = await Promise.all(
        transactions.map(async (t) => {
          if (!t.proof_image_url) return t
          const path = extractPathFromPublicUrl(t.proof_image_url)
          if (!path) return t
          const { data } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(path, 60 * 60)
          return {
            ...t,
            proof_image_url: data?.signedUrl ?? t.proof_image_url,
          }
        })
      )
    }

    return NextResponse.json({ transactions: transactionsWithSignedUrls })
  } catch (error) {
    console.error('Error in customer transactions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
