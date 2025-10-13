import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionTable from '@/components/customer/transaction-table'
import type { Database } from '@/types/database'
import type { PostgrestError } from '@supabase/supabase-js'

type PaymentRow = Database['public']['Tables']['payments']['Row'
]

export default async function TransactionHistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

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
    .returns<PaymentRow[]>()
    .order('created_at', { ascending: false })

  if (error) {
    // Log raw error for maximum visibility and structured fields if present
    console.error('Error fetching payments:', error)
    const e = error as PostgrestError
    console.error('Payment fetch error details:', {
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
    })
  }

  const paymentsRows = (payments ?? [])

  const transactions = paymentsRows.map((p) => ({
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Riwayat Transaksi</h1>
      <TransactionTable transactions={transactionsWithSignedUrls} />
    </div>
  )
}