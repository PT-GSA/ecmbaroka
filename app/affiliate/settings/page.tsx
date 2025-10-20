import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import AffiliateLayout from '@/components/affiliate/layout'
import { Settings, User, Shield, Bell, CreditCard, Save, Edit, Eye, EyeOff } from 'lucide-react'

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  name: string | null
  email: string | null
  status: 'active' | 'inactive'
  visibility_level: 'basic' | 'enhanced'
  created_at: string
  commission_rate: number
  minimum_withdrawal?: number
}

export default async function AffiliateSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/affiliate/login')
  }

  // Ensure user is an active affiliate
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Terjadi kesalahan saat memuat data affiliate.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const aff = affiliate as unknown as AffiliateRow

  return (
    <AffiliateLayout affiliate={{
      id: aff.id,
      name: aff.name || '',
      code: aff.code,
      email: aff.email || ''
    }}>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Kelola pengaturan akun affiliate Anda</p>
          </div>
        </div>

        {/* Account Information */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name" 
                  defaultValue={aff.name || ''} 
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={aff.email || ''} 
                  placeholder="Masukkan email"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="affiliate_code">Affiliate Code</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="affiliate_code" 
                    value={aff.code} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Kode unik untuk identifikasi affiliate</p>
              </div>
              <div>
                <Label>Status Akun</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={aff.status === 'active' ? 'default' : 'secondary'}>
                    {aff.status === 'active' ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Aktif
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Nonaktif
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Bergabung</Label>
                <p className="text-sm text-gray-600 mt-1">{formatDate(aff.created_at)}</p>
              </div>
              <div>
                <Label>Level Visibilitas</Label>
                <Badge variant="outline" className="mt-1">
                  {aff.visibility_level === 'enhanced' ? 'Enhanced' : 'Basic'}
                </Badge>
              </div>
            </div>

            <Button className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </CardContent>
        </Card>

        {/* Commission Settings */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pengaturan Komisi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Komisi per Karton</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(Number(aff.commission_rate || 0))}
                  </span>
                  <Badge variant="outline">Read Only</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Ditentukan oleh admin</p>
              </div>
              <div>
                <Label>Minimum Withdrawal</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(Number(aff.minimum_withdrawal || 50000))}
                  </span>
                  <Badge variant="outline">Read Only</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum untuk pencairan</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Informasi Komisi</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Komisi dihitung per karton yang terjual</li>
                <li>• Komisi hanya diberikan untuk pesanan yang sudah dikonfirmasi admin</li>
                <li>• Rate komisi dapat berubah sesuai kebijakan perusahaan</li>
                <li>• Anda akan mendapat notifikasi jika ada perubahan rate</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Pengaturan Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifikasi Email</Label>
                  <p className="text-sm text-gray-600">Terima notifikasi via email</p>
                </div>
                <Button variant="outline" size="sm">Aktif</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifikasi Order Baru</Label>
                  <p className="text-sm text-gray-600">Notifikasi saat ada order baru</p>
                </div>
                <Button variant="outline" size="sm">Aktif</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifikasi Withdrawal</Label>
                  <p className="text-sm text-gray-600">Notifikasi status pencairan</p>
                </div>
                <Button variant="outline" size="sm">Aktif</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifikasi Komisi</Label>
                  <p className="text-sm text-gray-600">Notifikasi perhitungan komisi</p>
                </div>
                <Button variant="outline" size="sm">Aktif</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Keamanan Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ubah Password</Label>
                  <p className="text-sm text-gray-600">Perbarui password akun Anda</p>
                </div>
                <Button variant="outline" size="sm">Ubah Password</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Tambahkan lapisan keamanan ekstra</p>
                </div>
                <Button variant="outline" size="sm">Setup 2FA</Button>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Tips Keamanan</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Gunakan password yang kuat dan unik</li>
                <li>• Jangan bagikan kredensial login dengan siapapun</li>
                <li>• Logout dari perangkat yang tidak terpercaya</li>
                <li>• Laporkan aktivitas mencurigakan ke admin</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informasi Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Catatan</Label>
              <Textarea 
                id="notes" 
                placeholder="Catatan atau informasi tambahan untuk admin..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Simpan Semua Perubahan
              </Button>
              <Button variant="outline">
                Reset ke Default
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AffiliateLayout>
  )
}
