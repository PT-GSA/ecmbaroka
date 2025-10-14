'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, CreditCard } from 'lucide-react'

interface Payment {
  id: string
  proof_image_url: string | null
  bank_name: string
  account_name: string
  transfer_date: string
  amount: number
  status: 'pending' | 'verified' | 'rejected' | 'completed'
  admin_notes: string | null
  created_at: string
}

interface PaymentVerificationProps {
  payments: Payment[]
  orderId: string
}

export default function PaymentVerification({ payments, orderId }: PaymentVerificationProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const verifyPayment = async (paymentId: string, status: 'verified' | 'rejected') => {
    setLoading(paymentId)
    setError('')
    setSuccess('')

    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status,
          admin_notes: adminNotes || null
        })
        .eq('id', paymentId)

      if (paymentError) {
        setError('Gagal memperbarui status pembayaran')
        return
      }

      // If payment is verified, update order status to 'verified'
      if (status === 'verified') {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'verified' })
          .eq('id', orderId)

        if (orderError) {
          setError('Gagal memperbarui status pesanan')
          return
        }

        // Trigger commission attribution for the order (silent, non-blocking)
        try {
          await fetch(`/api/admin/orders/${orderId}/commission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        } catch {
          // ignore commission attribution errors in admin verification flow
        }
      }

      const statusLabel = status === 'verified' ? 'Terverifikasi' : 'Ditolak'
      setSuccess(`Pembayaran berhasil ${statusLabel.toLowerCase()}`)
      setAdminNotes('')

      // Create notification for customer via secure API
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status, adminNotes }),
        })
      } catch {
        // silent fail; notification is non-blocking for admin flow
      }
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch {
      setError('Terjadi kesalahan saat memverifikasi pembayaran')
    } finally {
      setLoading(null)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, label: 'Menunggu Verifikasi' },
      verified: { variant: 'success' as const, label: 'Terverifikasi' },
      rejected: { variant: 'destructive' as const, label: 'Ditolak' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Verifikasi Pembayaran
        </CardTitle>
        <CardDescription>
          Review dan verifikasi bukti transfer dari customer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {payments.map((payment) => (
          <div key={payment.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Bukti Transfer #{payment.id.slice(-8)}</h4>
              {getPaymentStatusBadge(payment.status)}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Bank:</span>
                  <p className="font-medium">{payment.bank_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Atas Nama:</span>
                  <p className="font-medium">{payment.account_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tanggal Transfer:</span>
                  <p className="font-medium">{formatDate(payment.transfer_date)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Jumlah:</span>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                </div>
              </div>
              
                      {payment.proof_image_url && (
                        <div className="mt-4">
                          <span className="text-gray-600 text-sm">Bukti Transfer:</span>
                          <div className="mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={payment.proof_image_url} 
                              alt="Bukti Transfer"
                              className="max-w-full h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(payment.proof_image_url!, '_blank')}
                            />
                          </div>
                        </div>
                      )}
              
              {payment.admin_notes && (
                <div className="mt-3">
                  <span className="text-gray-600 text-sm">Catatan Admin:</span>
                  <p className="text-sm bg-white p-2 rounded border mt-1">
                    {payment.admin_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Verification Actions */}
            {payment.status === 'pending' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`notes-${payment.id}`}>Catatan (Opsional)</Label>
                  <Input
                    id={`notes-${payment.id}`}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Tambahkan catatan untuk customer"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => verifyPayment(payment.id, 'verified')}
                    disabled={loading === payment.id}
                    className="flex-1 hover:bg-green-500 hover:text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {loading === payment.id ? 'Memproses...' : 'Verifikasi'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => verifyPayment(payment.id, 'rejected')}
                    disabled={loading === payment.id}
                    className="flex-1 hover:bg-red-500 hover:text-white"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {loading === payment.id ? 'Memproses...' : 'Tolak'}
                  </Button>
                </div>
              </div>
            )}

            {payments.length > 1 && <Separator />}
          </div>
        ))}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
