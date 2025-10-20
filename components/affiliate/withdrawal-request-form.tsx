'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Banknote, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface WithdrawalFormProps {
  availableCommission: number
  minimumWithdrawal: number
  onSuccess?: () => void
}

export default function WithdrawalRequestForm({ 
  availableCommission, 
  minimumWithdrawal, 
  onSuccess 
}: WithdrawalFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    request_notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/affiliate/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request')
      }

      setSuccess(data.message)
      setFormData({
        amount: '',
        bank_name: '',
        account_number: '',
        account_holder_name: '',
        request_notes: ''
      })
      
      if (onSuccess) onSuccess()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isValidAmount = () => {
    const amount = Number(formData.amount)
    return amount >= minimumWithdrawal && amount <= availableCommission
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="w-5 h-5" />
          Request Pencairan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Available Commission Info */}
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Komisi Tersedia:</strong> {formatCurrency(availableCommission)}</p>
              <p><strong>Minimum Pencairan:</strong> {formatCurrency(minimumWithdrawal)}</p>
            </div>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder={`Minimum: ${minimumWithdrawal.toLocaleString('id-ID')}`}
              min={minimumWithdrawal}
              max={availableCommission}
              required
            />
            {formData.amount && !isValidAmount() && (
              <p className="text-sm text-red-600 mt-1">
                Jumlah harus antara {formatCurrency(minimumWithdrawal)} dan {formatCurrency(availableCommission)}
              </p>
            )}
          </div>

          {/* Bank Name */}
          <div>
            <Label htmlFor="bank_name">Nama Bank</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              placeholder="Contoh: BCA, Mandiri, BRI"
              required
            />
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="account_number">Nomor Rekening</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
              placeholder="Masukkan nomor rekening bank"
              required
            />
          </div>

          {/* Account Holder Name */}
          <div>
            <Label htmlFor="account_holder_name">Nama Pemegang Rekening</Label>
            <Input
              id="account_holder_name"
              value={formData.account_holder_name}
              onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
              placeholder="Nama sesuai dengan rekening bank"
              required
            />
          </div>

          {/* Request Notes */}
          <div>
            <Label htmlFor="request_notes">Catatan (Opsional)</Label>
            <Textarea
              id="request_notes"
              value={formData.request_notes}
              onChange={(e) => handleInputChange('request_notes', e.target.value)}
              placeholder="Catatan tambahan untuk admin..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading || !isValidAmount()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim Request...
              </>
            ) : (
              'Kirim Request Pencairan'
            )}
          </Button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Catatan Penting:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Request pencairan akan diproses admin dalam 1-3 hari kerja</li>
            <li>• Transfer bank akan dilakukan ke rekening yang Anda berikan</li>
            <li>• Anda akan mendapat notifikasi setelah transfer selesai</li>
            <li>• Pastikan data rekening bank sudah benar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
