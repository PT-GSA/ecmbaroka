'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Check
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  phone: string | null
  address: string | null
  role: 'customer' | 'admin'
  created_at: string
}

interface User {
  email: string
}

interface ProfileFormProps {
  profile: UserProfile
  user: User
  onUpdate?: (data: Partial<UserProfile>) => Promise<void>
}

export default function ProfileForm({ profile, user, onUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    phone: profile.phone || '',
    address: profile.address || ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    if (!onUpdate) return

    setIsLoading(true)
    setMessage(null)

    try {
      await onUpdate({
        full_name: formData.full_name,
        phone: formData.phone || null,
        address: formData.address || null
      })
      
      setMessage({ type: 'success', text: 'Profile berhasil diperbarui!' })
      setIsEditing(false)
    } catch {
      setMessage({ type: 'error', text: 'Gagal memperbarui profile. Silakan coba lagi.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name,
      phone: profile.phone || '',
      address: profile.address || ''
    })
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Informasi Profile</h3>
              <p className="text-sm text-gray-600">Kelola informasi akun Anda</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {message.type === 'success' ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <X className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Email (Read-only) */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-medium text-gray-900">{user.email}</span>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Tidak dapat diubah
            </Badge>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            Nama Lengkap
          </Label>
          {isEditing ? (
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Masukkan nama lengkap"
              required
              className="h-12"
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-medium text-gray-900">{profile.full_name}</span>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Phone className="h-4 w-4" />
            Nomor Telepon
          </Label>
          {isEditing ? (
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Masukkan nomor telepon"
              type="tel"
              className="h-12"
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-medium text-gray-900">
                {profile.phone || 'Belum diisi'}
              </span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            Alamat
          </Label>
          {isEditing ? (
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Masukkan alamat lengkap"
              rows={3}
              className="resize-none"
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-medium text-gray-900">
                {profile.address || 'Belum diisi'}
              </span>
            </div>
          )}
        </div>

        {/* Member Since */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Member Sejak
          </Label>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-medium text-gray-900">
              {formatDate(profile.created_at)}
            </span>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Role</Label>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
              {profile.role === 'admin' ? 'Administrator' : 'Customer'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 h-12 border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
