'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database'

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

export default function CreateAffiliateLinkForm({ 
  appUrl, 
  onLinkCreated 
}: { 
  appUrl: string
  onLinkCreated?: (link: Database['public']['Tables']['affiliate_links']['Row']) => void 
}) {
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
      if (onLinkCreated) {
        onLinkCreated(data.link)
      } else {
        router.refresh()
      }
    } catch  {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="campaign">Nama Campaign</Label>
        <Input 
          id="campaign" 
          value={campaign} 
          onChange={(e) => setCampaign(e.target.value)} 
          placeholder="Contoh: promo-akhir-tahun"
          className="w-full"
        />
      </div>

      {/* Slug Link with Generate Button */}
      <div className="space-y-2">
        <Label htmlFor="slug">Slug Link</Label>
        <div className="flex gap-2">
          <Input 
            id="slug" 
            value={slug} 
            onChange={(e) => setSlug(e.target.value)} 
            placeholder="Contoh: promo-akhir-tahun"
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuggest} 
            title="Buat slug dari campaign"
            className="px-4"
          >
            Generate
          </Button>
        </div>
      </div>

      {/* Tracking Link */}
      <div className="space-y-2">
        <Label>Tracking Link</Label>
        <div className="flex gap-2">
          <Input 
            value={trackingUrl} 
            readOnly
            className="flex-1 font-mono text-sm"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigator.clipboard.writeText(trackingUrl)}
            className="px-4"
          >
            Copy
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-600">{successMsg}</div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Membuat...' : 'Buat Link'}
        </Button>
      </div>
    </form>
  )
}