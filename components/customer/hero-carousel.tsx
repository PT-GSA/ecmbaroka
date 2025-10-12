"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

type HeroCarouselImage = {
  src: string
  alt?: string
}

interface HeroCarouselProps {
  images: HeroCarouselImage[]
  autoPlayInterval?: number
  className?: string
  children?: React.ReactNode
}

export default function HeroCarousel({
  images,
  autoPlayInterval = 5000,
  className = "",
  children,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1) return
    timerRef.current = setInterval(next, autoPlayInterval)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [images.length, autoPlayInterval, next])

  const pause = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const resume = () => {
    if (!timerRef.current && images.length > 1) {
      timerRef.current = setInterval(next, autoPlayInterval)
    }
  }

  return (
    <div
      className={`relative w-full h-[420px] md:h-[540px] lg:h-[680px] overflow-hidden ${className}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {images.map((img, i) => (
        <div
          key={img.src + i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={img.src}
            alt={img.alt || ""}
            fill
            sizes="100vw"
            priority={i === 0}
            unoptimized
            className="object-cover"
          />
        </div>
      ))}

      {/* Overlay gradient untuk keterbacaan teks */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />

      {/* Konten overlay (judul, CTA, dsb) */}
      {children ? <div className="absolute inset-0">{children}</div> : null}

      {/* Tombol navigasi */}
      {images.length > 1 && (
        <>
          <button
            aria-label="Sebelumnya"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-900" />
          </button>
          <button
            aria-label="Berikutnya"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow"
          >
            <ChevronRight className="h-5 w-5 text-neutral-900" />
          </button>
        </>
      )}

      {/* Indikator dot */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === index ? "bg-white scale-110" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}