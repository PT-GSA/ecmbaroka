'use client'

import { useState } from 'react'
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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Keamanan Akun</h3>
            <p className="text-sm text-gray-600">Ganti password admin Anda</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {message.type === 'success' ? <Check className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-white" />}
            </div>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Password Saat Ini</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              required
              className="h-12"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Password Baru</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru"
              required
              className="h-12"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Konfirmasi Password Baru</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              className="h-12"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}