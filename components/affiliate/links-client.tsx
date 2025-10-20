'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import LinkManagement from '@/components/affiliate/link-management'
import { Eye, EyeOff } from 'lucide-react'

type AffiliateLinkRow = {
  id: string
  campaign: string | null
  url_slug: string
  active: boolean
  created_at: string
}

type AffiliateClickRow = {
  campaign: string | null
  clicked_at: string
}

interface LinksClientProps {
  links: AffiliateLinkRow[]
  clicks: AffiliateClickRow[]
  appUrl: string
}

export default function LinksClient({ links, clicks, appUrl }: LinksClientProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Calculate clicks per campaign
  const clicksByCampaign = new Map<string, number>()
  clicks.forEach((c) => {
    const key = (c.campaign ?? '').trim()
    clicksByCampaign.set(key, (clicksByCampaign.get(key) ?? 0) + 1)
  })

  // Handler functions for link management
  const handleUpdateLink = async (id: string, data: { campaign?: string; url_slug?: string; active?: boolean }) => {
    setIsUpdating(id)
    try {
      const response = await fetch(`/api/affiliate/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update link')
      }
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to update link:', error)
      alert('Gagal mengupdate link. Silakan coba lagi.')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteLink = async (id: string) => {
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/affiliate/links/${id}?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete link')
      }
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete link:', error)
      alert('Gagal menghapus link. Silakan coba lagi.')
    } finally {
      setIsDeleting(null)
    }
  }

  if (links.length === 0) {
    return (
      <Card className="shadow-sm rounded-xl">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">🔗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada link referral</h3>
          <p className="text-gray-600 mb-4">Buat link referral pertama Anda untuk mulai mendapatkan komisi</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {links.map((link) => {
        const campaignKey = (link.campaign ?? '').trim()
        const clicksCount = clicksByCampaign.get(campaignKey) ?? 0
        const trackingUrl = `${appUrl}/api/affiliate/track?slug=${encodeURIComponent(link.url_slug)}`
        
        return (
          <Card key={link.id} className="shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {link.campaign || 'Unnamed Campaign'}
                    </h3>
                    <Badge variant={link.active ? 'default' : 'secondary'}>
                      {link.active ? (
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
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Slug:</strong> {link.url_slug}</p>
                    <p><strong>Total Klik:</strong> {clicksCount.toLocaleString('id-ID')}</p>
                    <p><strong>Dibuat:</strong> {formatDate(link.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 lg:min-w-[400px]">
                  {/* Tracking Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tracking Link</label>
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
                  
                  {/* Management Actions */}
                  <LinkManagement 
                    link={link}
                    onUpdate={handleUpdateLink}
                    onDelete={handleDeleteLink}
                    isUpdating={isUpdating === link.id}
                    isDeleting={isDeleting === link.id}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
