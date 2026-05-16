'use client'
import { CycleSettings, getNextPeriodDate, getOvulationDate, addDays } from '@/lib/cycle'
import { CalendarHeart, Sparkles, AlertCircle } from 'lucide-react'

export default function ImportantCycleDates({ settings }: { settings: CycleSettings }) {
  const nextPeriod = getNextPeriodDate(settings)
  const ovulation = getOvulationDate(settings)
  
  const prePeriodStart = addDays(nextPeriod, -5)
  const prePeriodEnd = addDays(nextPeriod, -1)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="glass-card p-6 md:p-8 lg:p-10 mb-8">
      <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-6 border-b border-border pb-3 lg:pb-4">
        📅 Ngày quan trọng sắp tới
      </h3>
      
      <div className="space-y-4 lg:space-y-5">
        <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-rose-500/5 rounded-xl lg:rounded-2xl border border-rose-500/10">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
            <CalendarHeart className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div>
            <p className="text-sm lg:text-base font-bold text-foreground/70">Kỳ kinh tiếp theo</p>
            <p className="text-base lg:text-lg font-bold text-rose-500">{formatDate(nextPeriod)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-fuchsia-500/5 rounded-xl lg:rounded-2xl border border-fuchsia-500/10">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-500">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div>
            <p className="text-sm lg:text-base font-bold text-foreground/70">Ngày rụng trứng dự kiến</p>
            <p className="text-base lg:text-lg font-bold text-fuchsia-500">{formatDate(ovulation)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-amber-500/5 rounded-xl lg:rounded-2xl border border-amber-500/10">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
            <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div>
            <p className="text-sm lg:text-base font-bold text-foreground/70">Giai đoạn nhạy cảm (Trước kinh)</p>
            <p className="text-base lg:text-lg font-bold text-amber-600">
              {formatDate(prePeriodStart)} - {formatDate(prePeriodEnd)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
