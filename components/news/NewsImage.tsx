'use client'

import { useEffect, useState } from 'react'

interface NewsImageProps {
  src: string | null
  alt: string
  fallbackSeed: string
  className?: string
}

function getFallbackUrl(seed: string) {
  const safeSeed = encodeURIComponent(seed || 'news-article')

  return `https://picsum.photos/seed/news-${safeSeed}/800/450`
}

export function NewsImage({
  src,
  alt,
  fallbackSeed,
  className = '',
}: NewsImageProps) {
  const fallbackUrl = getFallbackUrl(fallbackSeed)

  // PENTING:
  // Saat server/hard refresh, tampilkan fallback dulu.
  const [imgSrc, setImgSrc] = useState(fallbackUrl)

  useEffect(() => {
    if (!src) return

    // Setelah React sudah mounted,
    // baru coba gambar original.
    setImgSrc(src)
  }, [src])

  const handleError = () => {
    // Kalau original gagal, balik ke Picsum.
    setImgSrc(fallbackUrl)
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={className}
      loading="eager"
    />
  )
}