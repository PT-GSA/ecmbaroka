'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type StoreSettings = {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  bankName: string
  accountNumber: string
  accountName: string
}

const DEFAULTS: StoreSettings = {
  storeName: 'Susu Baroka',
  storeAddress: 'Jl. Merdeka No. 123, Jakarta Selatan',
  storePhone: '+62 812-3456-7890',
  storeEmail: 'info@susubaroka.com',
  bankName: 'BCA',
  accountNumber: '1234567890',
  accountName: 'Susu Baroka',
}

export default function StoreSettingsForm() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMessage('')
      setError('')
      try {
        const res = await fetch('/api/admin/store-settings', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch settings')
        const json = await res.json()
        const s = (json?.settings ?? DEFAULTS) as StoreSettings
        setSettings(s)
      } catch {
        setError('Gagal memuat pengaturan, gunakan default sementara.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/store-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setMessage('Pengaturan berhasil disimpan.')
    } catch {
      setError('Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle>Pengaturan Toko</CardTitle>
        <CardDescription>Atur informasi toko dan rekening untuk invoice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-gray-600">Memuat pengaturan...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Toko</Label>
                <Input value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email Toko</Label>
                <Input type="email" value={settings.storeEmail} onChange={e => setSettings({ ...settings, storeEmail: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat Toko</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={settings.storeAddress}
                onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input value={settings.storePhone} onChange={e => setSettings({ ...settings, storePhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bank</Label>
                <Input value={settings.bankName} onChange={e => setSettings({ ...settings, bankName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Rekening</Label>
                <Input value={settings.accountNumber} onChange={e => setSettings({ ...settings, accountNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Atas Nama</Label>
                <Input value={settings.accountName} onChange={e => setSettings({ ...settings, accountName: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
              {message && <span className="text-green-600 text-sm">{message}</span>}
              {error && <span className="text-red-600 text-sm">{error}</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}