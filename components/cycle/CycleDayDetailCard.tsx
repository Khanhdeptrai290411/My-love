'use client'
import { CycleSettings, getCycleDayInfo, getCycleForecast, formatDateKey } from '@/lib/cycle'

export default function CycleDayDetailCard({ selectedDate, settings }: { selectedDate: Date, settings: CycleSettings }) {
  const info = getCycleDayInfo(selectedDate, settings)
  const forecast = getCycleForecast(info.phase)
  
  const dateStr = selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  
  const phaseNames = {
    period: 'Kinh nguyệt',
    follicular: 'Nang trứng',
    ovulation: 'Rụng trứng',
    luteal: 'Hoàng thể',
    prePeriod: 'Trước kinh',
    latePeriod: 'Trễ kinh'
  }

  return (
    <div className="glass-card p-6 md:p-8 lg:p-10 mb-8 relative overflow-hidden border-2 border-primary/10">
      <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none">
        {forecast.icon}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-secondary flex items-center justify-center text-3xl lg:text-5xl shadow-sm">
            {forecast.icon}
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground capitalize mb-1 lg:mb-2">{phaseNames[info.phase]}</h2>
            <p className="text-sm lg:text-base font-medium text-foreground/60">{dateStr}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:gap-3 mb-6 lg:mb-8">
          <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-primary/10 text-primary rounded-lg text-sm lg:text-base font-bold">
            {info.isLate ? `Trễ ${info.daysLate} ngày` : `Ngày ${info.cycleDayNum}/${settings.cycleLength}`}
          </span>
          <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-secondary text-foreground/80 rounded-lg text-sm lg:text-base font-bold">
            {forecast.title}
          </span>
          <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-secondary text-foreground/80 rounded-lg text-sm lg:text-base font-bold">
            {forecast.loveTemp}
          </span>
          <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-sm lg:text-base font-bold">
            {forecast.status}
          </span>
        </div>

        <div className="bg-background/50 backdrop-blur-sm p-5 lg:p-6 rounded-2xl border border-border mb-4 lg:mb-6">
          <h4 className="text-base lg:text-lg font-bold text-primary mb-2 lg:mb-3 flex items-center gap-2">
            💡 Lời khuyên cho bạn
          </h4>
          <p className="text-foreground/90 leading-relaxed font-medium lg:text-lg">
            {forecast.advice}
          </p>
        </div>

        <div className="bg-secondary/30 p-4 lg:p-5 rounded-2xl border border-border">
          <p className="text-sm lg:text-base text-foreground/70 italic">
            <span className="font-semibold not-italic">Thông tin thêm:</span> {forecast.explanation}
          </p>
        </div>
      </div>
    </div>
  )
}
