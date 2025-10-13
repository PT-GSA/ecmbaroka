'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Check, X } from 'lucide-react'

export default function ChangePasswordForm() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak sama' })
      return
    }

    setLoading(true)

    try {
      // Supabase tidak mendukung verifikasi current password secara langsung.
      // Kita lakukan sign-in ulang untuk verifikasi current password.
      const { data: auth } = await supabase.auth.getUser()
      const email = auth.user?.email
      if (!email) throw new Error('Tidak dapat mengambil email pengguna')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        setMessage({ type: 'error', text: 'Password saat ini salah' })
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Password berhasil diperbarui' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Keamanan Akun
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Ganti password admin Anda</p>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label>Password Saat Ini</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password Baru</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Konfirmasi Password Baru</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="hover:bg-amber-300">
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}