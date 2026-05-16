'use client'
import { useState } from 'react'
import { CycleSettings, getCycleDayInfo, getCycleDailyMessage, formatDateKey } from '@/lib/cycle'
import { Copy, CheckCircle2 } from 'lucide-react'

export default function CycleDailyMessageCard({ selectedDate, settings }: { selectedDate: Date, settings: CycleSettings }) {
  const [copied, setCopied] = useState(false)
  const info = getCycleDayInfo(selectedDate, settings)
  const dateStr = formatDateKey(selectedDate)
  const message = getCycleDailyMessage(info.phase, dateStr)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-card p-6 md:p-8 lg:p-10 mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h3 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
          💌 Tin nhắn gợi ý hôm nay
        </h3>
        <button 
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-sm lg:text-base font-bold transition-all ${
            copied ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 hover:bg-primary/20 text-primary'
          }`}
        >
          {copied ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> : <Copy className="w-4 h-4 lg:w-5 lg:h-5" />}
          {copied ? 'Đã copy' : 'Copy'}
        </button>
      </div>
      
      <div className="bg-background/80 p-5 lg:p-8 rounded-2xl border border-border italic text-foreground/90 font-medium text-lg lg:text-xl leading-relaxed shadow-sm text-center lg:text-left">
        &quot;{message}&quot;
      </div>
    </div>
  )
}
