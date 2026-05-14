'use client'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useMemo } from 'react'
import { IAnniversary } from '@/models/Anniversary'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function UpcomingEventBackground() {
  const { data: session } = useSession()
  const { data } = useSWR(session ? '/api/anniversary' : null, fetcher)

  const upcomingText = useMemo(() => {
    if (!data?.events) return []
    
    const now = new Date()
    // Normalize today to start of day
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const upcoming: string[] = []
    
    data.events.forEach((event: IAnniversary) => {
      const eventDate = new Date(event.date)
      let nextOccurrence = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      
      // If the date has already passed this year, it will occur next year
      if (nextOccurrence < today) {
        nextOccurrence.setFullYear(today.getFullYear() + 1)
      }
      
      const diffTime = nextOccurrence.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 30) {
        if (diffDays === 0) {
          upcoming.push(`Hôm nay là: ${event.title}`)
        } else {
          upcoming.push(`Còn ${diffDays} ngày đến ${event.title} (${nextOccurrence.getDate().toString().padStart(2, '0')}/${(nextOccurrence.getMonth() + 1).toString().padStart(2, '0')})`)
        }
      }
    })
    
    return upcoming
  }, [data])

  if (!upcomingText || upcomingText.length === 0) return null

  // Join events to make a continuous marquee string
  const marqueeString = upcomingText.join(' • ') + ' • '

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex flex-col justify-center gap-16 md:gap-24 opacity-[0.08] select-none" aria-hidden="true">
      <style jsx>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-container {
          display: flex;
          width: max-content;
        }
        .marquee-left {
          animation: marquee-left 90s linear infinite;
        }
        .marquee-right {
          animation: marquee-right 90s linear infinite;
        }
      `}</style>
      
      <div className="absolute inset-0 flex flex-col justify-center -rotate-[20deg] scale-[2.0]">
        {[...Array(7)].map((_, i) => (
          <div key={i} className={`marquee-container ${i % 2 === 0 ? 'marquee-left' : 'marquee-right'} whitespace-nowrap text-primary font-black text-3xl md:text-5xl tracking-widest my-6 md:my-10`}>
            <span>{marqueeString.repeat(10)}</span>
            <span>{marqueeString.repeat(10)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
