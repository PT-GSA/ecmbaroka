'use client'

import { useState } from 'react'
import Image from 'next/image'

type MediaItem = {
  type: 'image' | 'video'
  url: string
}

export default function ProductMediaGallery({
  items,
  alt = 'Product media',
}: {
  items: MediaItem[]
  alt?: string
}) {
  const [active, setActive] = useState(0)

  if (!items || items.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400">No media available</span>
      </div>
    )
  }

  const current = items[active]

  return (
    <div className="space-y-4">
      {/* Main viewer */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
        {current.type === 'image' ? (
          <Image
            src={current.url}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <video
            src={current.url}
            controls
            preload="metadata"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Media ${idx + 1}`}
            onClick={() => setActive(idx)}
            className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition ring-offset-1 ${
              idx === active ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-400'
            }`}
            aria-current={idx === active ? 'true' : 'false'}
          >
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt={`${alt} ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <video src={item.url} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 text-black text-xs px-2 py-1 rounded-md">Video</div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}