"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, ImageIcon, Video } from 'lucide-react'

interface MediaItem {
  name: string
  publicUrl: string
  type: 'image' | 'video' | 'other'
}

export default function ProductMediaManager({ productId }: { productId: string }) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const supabase = createClient()

  const isImageFile = (name: string) => /\.(png|jpg|jpeg|webp|gif)$/i.test(name)
  const isVideoFile = (name: string) => /\.(mp4|webm|ogg)$/i.test(name)

  const loadCover = async () => {
    const { data } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', productId)
      .single()
    setCoverUrl((data?.image_url as string) ?? null)
  }

  const refreshList = async () => {
    const { data, error } = await supabase.storage.from('products').list(productId, { limit: 200 })
    if (error) return
    const items: MediaItem[] = (data || []).map((item) => {
      const publicUrl = supabase.storage.from('products').getPublicUrl(`${productId}/${item.name}`).data.publicUrl
      const type: MediaItem['type'] = isImageFile(item.name) ? 'image' : isVideoFile(item.name) ? 'video' : 'other'
      return { name: item.name, publicUrl, type }
    })
    setMedia(items)

    // Pastikan ada cover jika belum diset
    if (!coverUrl) {
      const firstImage = items.find((i) => i.type === 'image')
      if (firstImage) {
        await supabase
          .from('products')
          .update({ image_url: firstImage.publicUrl })
          .eq('id', productId)
        setCoverUrl(firstImage.publicUrl)
      }
    }
  }

  useEffect(() => {
    // muat cover terlebih dahulu, lalu daftar media
    loadCover().then(() => {
      refreshList()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fileNameSafe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${productId}/${Date.now()}-${fileNameSafe}`
        const { error } = await supabase.storage.from('products').upload(path, file, {
          contentType: file.type,
          upsert: true,
        })
        if (error) {
          console.error('Upload error:', error.message)
        }
      }
    } finally {
      setUploading(false)
      await loadCover()
      await refreshList()
      e.target.value = ''
    }
  }

  const handleRemove = async (name: string) => {
    const path = `${productId}/${name}`
    const { error } = await supabase.storage.from('products').remove([path])
    if (error) {
      console.error('Remove error:', error.message)
      return
    }
    // Jika yang dihapus adalah cover saat ini, kosongkan cover
    if (coverUrl && coverUrl.endsWith(`/${name}`)) {
      await supabase
        .from('products')
        .update({ image_url: null })
        .eq('id', productId)
      setCoverUrl(null)
      // Broadcast perubahan cover menjadi null
      try {
        window.dispatchEvent(new CustomEvent('product-cover-updated', { detail: { productId, url: null } }))
      } catch {}
    }
    await refreshList()
  }

  const handleSetCover = async (publicUrl: string) => {
    const { error } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', productId)
    if (error) {
      console.error('Set cover error:', error.message)
      return
    }
    setCoverUrl(publicUrl)
    // Broadcast perubahan cover
    try {
      window.dispatchEvent(new CustomEvent('product-cover-updated', { detail: { productId, url: publicUrl } }))
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Upload className="h-4 w-4" />
          <span>Unggah gambar atau video</span>
        </div>
        <div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {media.length > 0 ? (
          media.map((item) => (
            <div key={item.name} className="relative aspect-square overflow-hidden rounded-lg group">
              {item.type === 'image' ? (
                <Image
                  src={item.publicUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                  className="object-cover"
                />
              ) : item.type === 'video' ? (
                <video src={item.publicUrl} controls className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">{item.name}</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-start justify-end p-1 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.type === 'image' && (
                  <Button size="sm" variant="secondary" onClick={() => handleSetCover(item.publicUrl)}>
                    Jadikan Cover
                  </Button>
                )}
                <Button size="icon" variant="destructive" onClick={() => handleRemove(item.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-1 left-1">
                {item.type === 'image' ? (
                  <span className="inline-flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                    <ImageIcon className="h-3 w-3" /> Gambar
                  </span>
                ) : item.type === 'video' ? (
                  <span className="inline-flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                    <Video className="h-3 w-3" /> Video
                  </span>
                ) : null}
              </div>
              {coverUrl === item.publicUrl && (
                <div className="absolute top-1 left-1">
                  <span className="inline-flex items-center bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                    Cover
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-sm text-gray-500 py-8">Belum ada media</div>
        )}
      </div>
      {uploading && <div className="text-xs text-gray-500">Mengunggah...</div>}
    </div>
  )
}