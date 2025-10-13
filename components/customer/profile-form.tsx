'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Profile
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Kelola informasi akun Anda
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">{user.email}</span>
            <Badge variant="outline" className="text-xs">
              Tidak dapat diubah
            </Badge>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nama Lengkap
          </Label>
          {isEditing ? (
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Masukkan nama lengkap"
              required
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{profile.full_name}</span>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Nomor Telepon
          </Label>
          {isEditing ? (
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Masukkan nomor telepon"
              type="tel"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">
                {profile.phone || 'Belum diisi'}
              </span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Alamat
          </Label>
          {isEditing ? (
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Masukkan alamat lengkap"
              rows={3}
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">
                {profile.address || 'Belum diisi'}
              </span>
            </div>
          )}
        </div>

        {/* Member Since */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Member Sejak
          </Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">
              {formatDate(profile.created_at)}
            </span>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label>Role</Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
              {profile.role === 'admin' ? 'Administrator' : 'Customer'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
