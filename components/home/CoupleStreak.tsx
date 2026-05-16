'use client'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Flame } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CoupleStreak() {
  const { data } = useSWR('/api/couple/streak', fetcher)
  const [streak, setStreak] = useState(0)
  const [isActiveToday, setIsActiveToday] = useState(false)

  useEffect(() => {
    if (data?.activityLogs) {
      import('@/lib/streak').then(({ calculateStreak, isTodayCompleted }) => {
        setStreak(calculateStreak(data.activityLogs, new Date()))
        setIsActiveToday(isTodayCompleted(data.activityLogs, new Date()))
      })
    }
  }, [data])

  if (!data?.activityLogs) return null

  return (
    <div className={`mx-auto w-fit mt-4 flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
      isActiveToday 
        ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
        : 'bg-secondary/30 border-border text-foreground/50'
    }`}>
      {isActiveToday ? (
        <Flame className="fill-primary animate-pulse" size={18} />
      ) : (
        <Flame size={18} />
      )}
      <span className="font-bold text-sm">
        {streak > 0 ? `Chuỗi ${streak} ngày` : 'Chưa có chuỗi'}
      </span>
      {!isActiveToday && (
        <span className="text-xs ml-1 border-l border-border pl-2 opacity-80">
          Chờ cả hai cùng active hôm nay
        </span>
      )}
    </div>
  )
}
