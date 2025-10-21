'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import CreateAffiliateLinkForm from '@/components/affiliate/create-link-form'
import LinksClient from '@/components/affiliate/links-client'

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

interface AffiliateLinksWrapperProps {
  initialLinks: AffiliateLinkRow[]
  clicks: AffiliateClickRow[]
  appUrl: string
}

export default function AffiliateLinksWrapper({ 
  initialLinks, 
  clicks, 
  appUrl 
}: AffiliateLinksWrapperProps) {
  const [links, setLinks] = useState<AffiliateLinkRow[]>(initialLinks)

  const handleLinkCreated = (newLink: AffiliateLinkRow) => {
    setLinks(prev => [newLink, ...prev])
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Links & Campaigns</h1>
          <p className="text-gray-600">Kelola link referral dan campaign Anda</p>
        </div>
      </div>

      {/* Create New Link */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Buat Link Referral Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateAffiliateLinkForm 
            appUrl={appUrl} 
            onLinkCreated={handleLinkCreated}
          />
        </CardContent>
      </Card>

      {/* Links List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Link Referral Anda</h2>
        
        <LinksClient 
          links={links}
          clicks={clicks}
          appUrl={appUrl}
        />
      </div>

      {/* Tips */}
      <Card className="shadow-sm rounded-xl bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips untuk Meningkatkan Konversi</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Gunakan nama campaign yang menarik dan mudah diingat</li>
            <li>• Bagikan link di media sosial dengan konten yang menarik</li>
            <li>• Buat beberapa campaign untuk audiens yang berbeda</li>
            <li>• Pantau performa setiap campaign secara berkala</li>
            <li>• Gunakan slug yang pendek dan mudah diingat</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
