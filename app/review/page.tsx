'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { getDaysInYear, getDateKey, getDayOfWeek } from '@/lib/review-utils'
import HeartLoader from '@/components/HeartLoader'
import { formatDateForDisplay } from '@/components/DateInput'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  // Ensure response is always an array
  return Array.isArray(data) ? data : []
}

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
  if (!mood || intensity === 0) return 'bg-gray-200 dark:bg-gray-800/80'
  const colors = MOOD_COLORS[mood]
  if (!colors) return 'bg-gray-200 dark:bg-gray-800/80'

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

  const { data: heatmapData, isLoading, error: heatmapError } = useSWR(
    `/api/review?year=${year}&view=${view}`,
    fetcher,
    { revalidateOnFocus: true }
  )

  // Normalize heatmapData to always be an array
  const normalizedHeatmapData = Array.isArray(heatmapData) ? heatmapData : []

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
    const data = normalizedHeatmapData.find((d: any) => d.date === dateKey)
    if (!data) {
      return view === 'couple'
        ? { me: null, partner: null }
        : { mood: null, intensity: 0 }
    }
    return data
  }

  if (status === 'loading') {
    return <HeartLoader />
  }

  // Get unique moods for legend
  const uniqueMoods = new Set<string>()
  normalizedHeatmapData.forEach((d: any) => {
    if (view === 'couple') {
      if (d.me?.mood) uniqueMoods.add(d.me.mood)
      if (d.partner?.mood) uniqueMoods.add(d.partner.mood)
    } else {
      if (d.mood) uniqueMoods.add(d.mood)
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        <h1 className="text-4xl font-bold mb-8 text-foreground flex items-center gap-2">Hồi tưởng năm {year}</h1>

        <div className="glass-card p-6 md:p-8 mb-6 border border-border">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2.5 border border-border rounded-xl text-foreground font-medium bg-background shadow-inner focus:ring-2 focus:ring-primary focus:outline-none"
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
              className="px-4 py-2.5 border border-border rounded-xl text-foreground font-medium bg-background shadow-inner focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="couple">Cả hai</option>
              <option value="me">Của mình</option>
              <option value="partner">Của người ấy</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-foreground/60 font-medium animate-pulse">Đang thu thập mảnh ký ức...</div>
            </div>
          ) : heatmapError ? (
            <div className="text-center py-12 text-red-600">
              Lỗi khi tải dữ liệu: {heatmapError.message || 'Unknown error'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-1">
                <div className="flex flex-col gap-1" style={{ marginTop: '-12px' }}>
                  {/* Empty row to match first week row */}
                  <div className="h-3"></div>
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div
                      key={day}
                      className="h-3 text-xs text-foreground/50 font-medium flex items-start justify-end pr-1"
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
                          const myColor = cellData.me ? getMoodColor(cellData.me.mood, cellData.me.intensity) : 'bg-gray-200 dark:bg-gray-800/80'
                          const partnerColor = cellData.partner ? getMoodColor(cellData.partner.mood, cellData.partner.intensity) : 'bg-gray-200 dark:bg-gray-800/80'

                          const myLabel = cellData.me && cellData.me.mood ? `${MOOD_LABELS[cellData.me.mood] || cellData.me.mood} (${cellData.me.intensity})` : 'Chưa check-in'
                          const partnerLabel = cellData.partner && cellData.partner.mood ? `${MOOD_LABELS[cellData.partner.mood] || cellData.partner.mood} (${cellData.partner.intensity})` : 'Chưa check-in'

                          return (
                            <Link
                              key={dateKey}
                              href={`/day/${dateKey}`}
                              className="w-3 h-3 rounded overflow-hidden hover:ring-2 hover:ring-pink-500 transition relative"
                              title={`${formatDateForDisplay(dateKey)} - Mình: ${myLabel} | Người ấy: ${partnerLabel}`}
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
                            title={`${formatDateForDisplay(dateKey)}${cellData.mood ? ` - ${MOOD_LABELS[cellData.mood] || cellData.mood} (${cellData.intensity})` : ''}`}
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
          <div className="mt-8 pt-8 border-t border-border space-y-2">
            <div className="text-sm text-foreground/80 font-bold mb-4">Chú thích:</div>
            <div className="flex flex-wrap gap-4">
              {Array.from(uniqueMoods).map((mood) => {
                const colors = MOOD_COLORS[mood]
                if (!colors) return null // Skip invalid moods
                return (
                  <div key={mood} className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className={`w-3 h-3 rounded ${colors.light}`}></div>
                      <div className={`w-3 h-3 rounded ${colors.medium}`}></div>
                      <div className={`w-3 h-3 rounded ${colors.dark}`}></div>
                    </div>
                    <span className="text-xs text-foreground/60 font-medium">{MOOD_LABELS[mood] || mood}</span>
                  </div>
                )
              })}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800/80"></div>
                <span className="text-xs text-foreground/60 font-medium">Chưa check-in</span>
              </div>
            </div>
            <div className="text-xs text-foreground/50 mt-4 font-medium">
              Đậm nhạt theo cường độ (1: nhạt, 2: vừa, 3: đậm)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
