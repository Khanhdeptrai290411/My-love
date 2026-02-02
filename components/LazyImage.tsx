'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  /** Base64/data URL: use native img and only set src when in view to avoid decoding many at once */
  isDataUrl?: boolean
  width?: number
  height?: number
  /** For grid layout: max height when single image vs in grid */
  maxHeightClass?: string
  unoptimized?: boolean
  onError?: () => void
}

/**
 * Chỉ set src ảnh khi element vào viewport → giảm lag khi nhiều ảnh base64.
 * Ảnh URL (Cloudinary) vẫn lazy load bình thường.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  isDataUrl = false,
  width,
  height,
  maxHeightClass,
  unoptimized,
  onError,
}: LazyImageProps) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset loaded state when src changes.
  // For remote URLs (Cloudinary), don't hide with opacity-0 (avoid "blank area").
  useEffect(() => {
    const base64 = isDataUrl || src.startsWith('data:')
    setLoaded(!base64)
  }, [src, isDataUrl])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setInView(true)
      },
      { rootMargin: '100px', threshold: 0.01 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Tạm thời luôn hiển thị ảnh khi có src (bỏ phụ thuộc IntersectionObserver để tránh lỗi không hiện ảnh)
  const showImage = !!src
  const isBase64 = isDataUrl || src.startsWith('data:')

  return (
    <div ref={containerRef} className={`relative ${maxHeightClass || ''}`}>
      {!showImage ? (
        <div
          className={`bg-gray-200 animate-pulse rounded ${className}`}
          style={{ minHeight: 120 }}
          aria-hidden
        />
      ) : isBase64 ? (
        <img
          src={src}
          alt={alt}
          className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={onError}
          style={{ maxWidth: '100%' }}
        />
      ) : (
        // Render remote URL bằng <img> để tránh lỗi pipeline `next/image` làm ảnh không hiện
        <img
          src={src}
          alt={alt}
          className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={onError}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      )}
    </div>
  )
}
