'use client'

import React from 'react'

interface LinkPreviewProps {
  url: string
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  // Regex patterns
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/)
  
  const fbMatch = url.match(/facebook\.com\/.*\/videos\/.*/i) || url.match(/fb\.watch\/.*[a-zA-Z0-9_-]/i)

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1]
    return (
      <div className="mt-2 mb-3 relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-black shadow-sm">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    )
  }

  if (ytShortsMatch && ytShortsMatch[1]) {
    const videoId = ytShortsMatch[1]
    return (
      <div className="mt-2 mb-3 relative w-full max-w-[315px] mx-auto pt-[177.7%] md:pt-[0] md:h-[560px] rounded-lg overflow-hidden bg-black shadow-sm">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute top-0 left-0 w-full h-full md:static md:w-[315px] md:h-[560px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    )
  }

  if (fbMatch) {
    return (
      <div className="mt-2 mb-3 w-full flex justify-center bg-black rounded-lg overflow-hidden shadow-sm">
        <iframe
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`}
          className="w-full h-[315px] md:h-[400px] border-none"
          scrolling="no"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        ></iframe>
      </div>
    )
  }

  return null
}

