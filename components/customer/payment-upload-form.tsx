'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Upload, Calendar } from 'lucide-react'

interface PaymentUploadFormProps {
  orderId: string
}

export default function PaymentUploadForm({ orderId }: PaymentUploadFormProps) {
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [amount, setAmount] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar')
        return
      }
      
      setProofFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!proofFile) {
      setError('Pilih file bukti transfer')
      setLoading(false)
      return
    }

    try {
      // Upload proof image to Supabase Storage
      const fileExt = proofFile.name.split('.').pop()
      const fileName = `${orderId}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile)

      if (uploadError) {
        setError('Gagal mengupload bukti transfer')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          proof_image_url: urlData.publicUrl,
          bank_name: bankName,
          account_name: accountName,
          transfer_date: transferDate,
          amount: parseFloat(amount),
          status: 'pending',
        })

      if (paymentError) {
        setError('Gagal menyimpan data pembayaran')
        return
      }

      // Update order status to 'paid'
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)

      if (orderError) {
        setError('Gagal memperbarui status pesanan')
        return
      }

      setSuccess('Bukti transfer berhasil diupload! Tim kami akan memverifikasi pembayaran Anda.')
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch (err) {
      setError('Terjadi kesalahan saat mengupload bukti transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Bukti Transfer
        </CardTitle>
        <CardDescription>
          Upload bukti transfer untuk mempercepat proses verifikasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: BCA, Mandiri, BRI"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountName">Atas Nama</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Nama pemilik rekening"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transferDate">Tanggal Transfer</Label>
              <Input
                id="transferDate"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Transfer</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Jumlah yang ditransfer"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proofFile">Bukti Transfer</Label>
            <Input
              id="proofFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-gray-500">
              Upload foto/screenshot bukti transfer (max 5MB, format: JPG, PNG)
            </p>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Mengupload...' : 'Upload Bukti Transfer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
