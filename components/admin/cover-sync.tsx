"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

export default function CoverSync({ productId, initialCoverUrl }: { productId: string, initialCoverUrl: string | null }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null)

  useEffect(() => {
    type CoverUpdatedDetail = { productId: string; url: string | null }
    const handler: EventListener = (e) => {
      const detail = (e as CustomEvent<CoverUpdatedDetail>).detail
      if (!detail || detail.productId !== productId) return
      setCoverUrl(detail.url ?? null)
      const input = document.getElementById('image_url') as HTMLInputElement | null
      if (input) {
        input.value = detail.url ?? ''
      }
    }
    window.addEventListener('product-cover-updated', handler)
    return () => {
      window.removeEventListener('product-cover-updated', handler)
    }
  }, [productId])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="font-medium">Cover aktif</span>
          <Badge variant="default">{coverUrl ? 'Tersetel' : 'Belum ada'}</Badge>
        </div>
      </div>
      <div className="relative w-full max-w-xs aspect-square overflow-hidden rounded-lg border bg-gray-50">
        {coverUrl ? (
          <Image src={coverUrl} alt="Cover produk" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak ada cover</div>
        )}
      </div>
    </div>
  )
}