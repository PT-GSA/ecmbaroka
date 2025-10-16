'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CopyInput from '@/components/ui/copy-input'

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

export default function CreateAffiliateLinkForm({ appUrl }: { appUrl: string }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const trackingUrl = `${appUrl}/api/affiliate/track?slug=${encodeURIComponent(slug || 'my-campaign')}`

  const onSuggest = () => {
    if (!campaign) return
    setSlug(slugify(campaign))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const url_slug = slugify(slug || campaign)
      if (!url_slug) {
        setError('Slug tidak valid')
        setLoading(false)
        return
      }
      const res = await fetch('/api/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign, url_slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Gagal membuat link')
        setLoading(false)
        return
      }
      setSuccessMsg('Link berhasil dibuat')
      router.refresh()
    } catch  {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="campaign">Nama Campaign</Label>
          <Input id="campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Contoh: promo-akhir-tahun" />
        </div>
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="slug">Slug Link</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Contoh: promo-akhir-tahun" />
            </div>
            <Button type="button" variant="outline" onClick={onSuggest} title="Buat slug dari campaign">Generate</Button>
          </div>
        </div>
      </div>

      <CopyInput value={trackingUrl} label="Tracking link" className="max-w-[560px]" />

      {error && <div className="text-sm text-red-600">{error}</div>}
      {successMsg && <div className="text-sm text-green-600">{successMsg}</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Membuat...' : 'Buat Link'}</Button>
      </div>
    </form>
  )
}