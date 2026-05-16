'use client'
import { useState } from 'react'
import { CycleSettings } from '@/lib/cycle'
import toast from 'react-hot-toast'

export default function CycleSettingsForm({ initialSettings, onSave }: { initialSettings?: CycleSettings | null, onSave: (s: CycleSettings) => void }) {
  const [isOpen, setIsOpen] = useState(!initialSettings)
  const [lastPeriodStart, setLastPeriodStart] = useState(initialSettings?.lastPeriodStart || '')
  const [periodLength, setPeriodLength] = useState(initialSettings?.periodLength || 5)
  const [cycleLength, setCycleLength] = useState(initialSettings?.cycleLength || 28)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lastPeriodStart) {
      toast.error('Vui lòng chọn ngày bắt đầu kỳ kinh gần nhất')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/couple/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPeriodStart, periodLength, cycleLength })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Đã lưu thiết lập chu kỳ!')
        onSave(data.cycleSettings)
        setIsOpen(false)
      } else {
        toast.error(data.error || 'Lỗi khi lưu')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground py-3 rounded-xl border border-border transition-colors font-medium text-sm flex items-center justify-center gap-2 mb-6"
      >
        ⚙️ Cài đặt chu kỳ
      </button>
    )
  }

  return (
    <div className="glass-card p-6 md:p-8 mb-8 border-2 border-primary/20 relative">
      <h3 className="text-xl font-bold text-primary mb-4">Cài đặt chu kỳ</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Ngày bắt đầu kỳ kinh gần nhất</label>
          <input 
            type="date" 
            value={lastPeriodStart}
            onChange={e => setLastPeriodStart(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Số ngày hành kinh (ngày)</label>
            <input 
              type="number" 
              min="1" max="15"
              value={periodLength}
              onChange={e => setPeriodLength(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Độ dài chu kỳ (ngày)</label>
            <input 
              type="number" 
              min="20" max="60"
              value={cycleLength}
              onChange={e => setCycleLength(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          {initialSettings && (
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 bg-secondary/50 hover:bg-secondary rounded-xl font-bold transition-all"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
