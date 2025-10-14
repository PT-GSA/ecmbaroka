'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Package, Truck, XCircle } from 'lucide-react'

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: string
}

export default function OrderStatusUpdate({ orderId, currentStatus }: OrderStatusUpdateProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const statusOptions = [
    { value: 'verified', label: 'Terverifikasi', icon: CheckCircle, description: 'Pembayaran telah diverifikasi' },
    { value: 'processing', label: 'Sedang Diproses', icon: Package, description: 'Pesanan sedang disiapkan' },
    { value: 'shipped', label: 'Sedang Dikirim', icon: Truck, description: 'Pesanan sedang dalam perjalanan' },
    { value: 'completed', label: 'Selesai', icon: CheckCircle, description: 'Pesanan telah diterima customer' },
    { value: 'cancelled', label: 'Dibatalkan', icon: XCircle, description: 'Pesanan dibatalkan' },
  ]

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        setError('Gagal memperbarui status pesanan')
        return
      }

      // Create notification for customer via secure API (order status)
      try {
        await fetch('/api/order-status-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: newStatus }),
        })
      } catch {
        // silent fail; notification is non-blocking for admin flow
      }

      // Attribute commission when moving to paid/verified (silent)
      if (['paid', 'verified'].includes(newStatus)) {
        try {
          await fetch(`/api/admin/orders/${orderId}/commission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        } catch {
          // ignore commission errors; does not block status update
        }
      }

      const statusLabel = statusOptions.find(opt => opt.value === newStatus)?.label || newStatus
      setSuccess(`Status pesanan berhasil diperbarui menjadi "${statusLabel}"`)
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch {
      setError('Terjadi kesalahan saat memperbarui status')
    } finally {
      setLoading(false)
    }
  }


  const canUpdateTo = (status: string) => {
    const statusOrder = ['pending', 'paid', 'verified', 'processing', 'shipped', 'completed', 'cancelled']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const targetIndex = statusOrder.indexOf(status)
    
    // Can only move forward in the flow or cancel at any time
    return targetIndex > currentIndex || status === 'cancelled'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Status Pesanan</CardTitle>
        <CardDescription>
          Perbarui status pesanan sesuai dengan progress pengiriman
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Status Saat Ini</h4>
          <Badge variant="outline" className="text-sm">
            {statusOptions.find(opt => opt.value === currentStatus)?.label || currentStatus}
          </Badge>
        </div>

        {/* Status Options */}
        <div className="space-y-3">
          <h4 className="font-medium">Update ke Status:</h4>
          <div className="grid gap-2">
            {statusOptions.map((option) => {
              const canUpdate = canUpdateTo(option.value)
              const isCurrent = option.value === currentStatus
              
              return (
                <Button
                  key={option.value}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  className="justify-start h-auto p-3 hover:bg-green-500 hover:text-white"
                  disabled={!canUpdate || loading || isCurrent}
                  onClick={() => updateStatus(option.value)}
                >
                  <option.icon className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

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
