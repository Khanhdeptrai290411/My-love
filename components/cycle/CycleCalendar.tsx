'use client'
import { useState } from 'react'
import { CycleSettings, getCycleDayInfo, parseLocalDate, addDays, formatDateKey } from '@/lib/cycle'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CycleCalendar({ 
  settings, 
  selectedDate, 
  onSelectDate 
}: { 
  settings: CycleSettings
  selectedDate: Date
  onSelectDate: (d: Date) => void 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  // Adjust to make Monday the first day of the week (0 = Mon, 6 = Sun)
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1

  const todayStr = formatDateKey(new Date())
  const selectedStr = formatDateKey(selectedDate)

  const monthName = currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  // Colors mapping for phases
  const phaseColors: Record<string, string> = {
    period: 'bg-rose-400 text-white shadow-rose-200 border-rose-500',
    follicular: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ovulation: 'bg-fuchsia-400 text-white shadow-fuchsia-200 border-fuchsia-500',
    luteal: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    prePeriod: 'bg-amber-100 text-amber-700 border-amber-200',
    latePeriod: 'bg-slate-200 text-slate-700 border-slate-300'
  }

  const phaseIcons: Record<string, string> = {
    period: '🩸',
    ovulation: '✨',
  }

  return (
    <div className="glass-card p-6 md:p-8 lg:p-10 mb-8">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Lịch chu kỳ</h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <span className="font-semibold lg:text-lg text-primary min-w-[120px] lg:min-w-[150px] text-center capitalize">{monthName}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-3 lg:gap-4 mb-4 lg:mb-8">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
          <div key={d} className="text-center text-xs lg:text-sm font-bold text-foreground/50 pb-2 lg:pb-4">{d}</div>
        ))}
        
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1)
          const dateStr = formatDateKey(date)
          const info = getCycleDayInfo(date, settings)
          const isSelected = dateStr === selectedStr
          const isToday = dateStr === todayStr

          const baseClass = "relative aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl border transition-all cursor-pointer font-medium text-sm md:text-base lg:text-xl hover:scale-105 active:scale-95"
          const colorClass = phaseColors[info.phase]
          const selectedClass = isSelected ? "ring-2 lg:ring-4 ring-primary ring-offset-2 ring-offset-background scale-105 z-10 font-bold" : "opacity-80 hover:opacity-100"
          const todayIndicator = isToday ? <div className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-primary animate-pulse" /> : null
          const icon = phaseIcons[info.phase] ? <span className="absolute bottom-1 lg:bottom-1.5 text-[10px] md:text-xs lg:text-sm">{phaseIcons[info.phase]}</span> : null

          return (
            <div 
              key={dateStr} 
              onClick={() => onSelectDate(date)}
              className={`${baseClass} ${colorClass} ${selectedClass}`}
            >
              {todayIndicator}
              <span>{i + 1}</span>
              {icon}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-border justify-center text-xs lg:text-sm font-medium">
        <div className="flex items-center gap-1.5 lg:gap-2"><div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-rose-400"></div> Hành kinh</div>
        <div className="flex items-center gap-1.5 lg:gap-2"><div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-emerald-200"></div> Nang trứng</div>
        <div className="flex items-center gap-1.5 lg:gap-2"><div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-fuchsia-400"></div> Rụng trứng</div>
        <div className="flex items-center gap-1.5 lg:gap-2"><div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-indigo-200"></div> Hoàng thể</div>
        <div className="flex items-center gap-1.5 lg:gap-2"><div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-amber-200"></div> Trước kinh</div>
        <div className="flex items-center gap-1.5 lg:gap-2"><div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-slate-200"></div> Trễ kinh</div>
      </div>
    </div>
  )
}
