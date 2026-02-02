'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { getDaysInYear, getDateKey, getDayOfWeek } from '@/lib/review-utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Mood color mapping
const MOOD_COLORS: Record<string, { base: string; light: string; medium: string; dark: string }> = {
  happy: { base: 'yellow', light: 'bg-yellow-200', medium: 'bg-yellow-400', dark: 'bg-yellow-600' },
  sad: { base: 'purple', light: 'bg-purple-200', medium: 'bg-purple-400', dark: 'bg-purple-600' },
  calm: { base: 'blue', light: 'bg-blue-200', medium: 'bg-blue-400', dark: 'bg-blue-600' },
  stressed: { base: 'red', light: 'bg-red-200', medium: 'bg-red-400', dark: 'bg-red-600' },
  excited: { base: 'green', light: 'bg-green-200', medium: 'bg-green-400', dark: 'bg-green-600' },
  tired: { base: 'gray', light: 'bg-gray-200', medium: 'bg-gray-400', dark: 'bg-gray-600' },
  anxious: { base: 'orange', light: 'bg-orange-200', medium: 'bg-orange-400', dark: 'bg-orange-600' },
  grateful: { base: 'pink', light: 'bg-pink-200', medium: 'bg-pink-400', dark: 'bg-pink-600' },
}

const MOOD_LABELS: Record<string, string> = {
  happy: 'Vui vẻ',
  sad: 'Buồn',
  calm: 'Bình yên',
  stressed: 'Căng thẳng',
  excited: 'Hào hứng',
  tired: 'Mệt mỏi',
  anxious: 'Lo lắng',
  grateful: 'Biết ơn',
}

const getMoodColor = (mood: string | null, intensity: number) => {
  if (!mood || intensity === 0) return 'bg-gray-100'
  const colors = MOOD_COLORS[mood]
  if (!colors) return 'bg-gray-100'
  
  if (intensity === 1) return colors.light
  if (intensity === 2) return colors.medium
  return colors.dark
}

export default function ReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [year, setYear] = useState(new Date().getFullYear())
  const [view, setView] = useState<'couple' | 'me' | 'partner'>('couple')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: heatmapData, isLoading } = useSWR(
    `/api/review?year=${year}&view=${view}`,
    fetcher,
    { revalidateOnFocus: true }
  )

  const days = getDaysInYear(year)
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  days.forEach((day) => {
    const dayOfWeek = getDayOfWeek(day)
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const getCellData = (date: Date) => {
    const dateKey = getDateKey(date)
    const data = heatmapData?.find((d: any) => d.date === dateKey)
    if (!data) {
      return view === 'couple' 
        ? { me: null, partner: null }
        : { mood: null, intensity: 0 }
    }
    return data
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  // Get unique moods for legend
  const uniqueMoods = new Set<string>()
  heatmapData?.forEach((d: any) => {
    if (view === 'couple') {
      if (d.me?.mood) uniqueMoods.add(d.me.mood)
      if (d.partner?.mood) uniqueMoods.add(d.partner.mood)
    } else {
      if (d.mood) uniqueMoods.add(d.mood)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Review năm {year}</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="couple">Cả hai</option>
              <option value="me">Của mình</option>
              <option value="partner">Của người ấy</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-800">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-1">
                <div className="flex flex-col gap-1" style={{ marginTop: '-12px' }}>
                  {/* Empty row to match first week row */}
                  <div className="h-3"></div>
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div 
                      key={day} 
                      className="h-3 text-xs text-gray-500 flex items-start justify-end pr-1"
                      style={{ 
                        lineHeight: '12px',
                        height: '12px',
                        minHeight: '12px',
                        marginTop: '0',
                        marginBottom: '0',
                        paddingTop: '0',
                        transform: 'translateY(-4px)'
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((day) => {
                        const cellData = getCellData(day)
                        const dateKey = getDateKey(day)
                        
                        if (view === 'couple') {
                          // Split cell: left half = me, right half = partner
                          const myColor = cellData.me ? getMoodColor(cellData.me.mood, cellData.me.intensity) : 'bg-gray-100'
                          const partnerColor = cellData.partner ? getMoodColor(cellData.partner.mood, cellData.partner.intensity) : 'bg-gray-100'
                          
                          const myLabel = cellData.me ? `${MOOD_LABELS[cellData.me.mood]} (${cellData.me.intensity})` : 'Chưa check-in'
                          const partnerLabel = cellData.partner ? `${MOOD_LABELS[cellData.partner.mood]} (${cellData.partner.intensity})` : 'Chưa check-in'
                          
                          return (
                            <Link
                              key={dateKey}
                              href={`/day/${dateKey}`}
                              className="w-3 h-3 rounded overflow-hidden hover:ring-2 hover:ring-pink-500 transition relative"
                              title={`${dateKey} - Mình: ${myLabel} | Người ấy: ${partnerLabel}`}
                            >
                              <div className="absolute inset-0 flex">
                                <div className={`w-1/2 ${myColor}`}></div>
                                <div className={`w-1/2 ${partnerColor}`}></div>
                              </div>
                            </Link>
                          )
                        }
                        
                        // Single mood view (me or partner)
                        return (
                          <Link
                            key={dateKey}
                            href={`/day/${dateKey}`}
                            className={`w-3 h-3 rounded ${getMoodColor(cellData.mood, cellData.intensity)} hover:ring-2 hover:ring-pink-500 transition`}
                            title={`${dateKey}${cellData.mood ? ` - ${MOOD_LABELS[cellData.mood]} (${cellData.intensity})` : ''}`}
                          />
                        )
                      })}
                      {week.length < 7 &&
                        Array.from({ length: 7 - week.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-3 h-3" />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 space-y-2">
            <div className="text-sm text-gray-800 font-semibold mb-2">Chú thích:</div>
            <div className="flex flex-wrap gap-4">
              {Array.from(uniqueMoods).map((mood) => (
                <div key={mood} className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className={`w-3 h-3 rounded ${MOOD_COLORS[mood].light}`}></div>
                    <div className={`w-3 h-3 rounded ${MOOD_COLORS[mood].medium}`}></div>
                    <div className={`w-3 h-3 rounded ${MOOD_COLORS[mood].dark}`}></div>
                  </div>
                  <span className="text-xs text-gray-600">{MOOD_LABELS[mood]}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-100"></div>
                <span className="text-xs text-gray-600">Chưa check-in</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Đậm nhạt theo cường độ (1: nhạt, 2: vừa, 3: đậm)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
