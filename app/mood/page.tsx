'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { getTodayDate } from '@/lib/utils'
import HeartLoader from '@/components/HeartLoader'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const moods = [
  { value: 'happy', label: 'Vui vẻ', emoji: '😊' },
  { value: 'sad', label: 'Buồn', emoji: '😢' },
  { value: 'calm', label: 'Bình yên', emoji: '😌' },
  { value: 'stressed', label: 'Căng thẳng', emoji: '😣' },
  { value: 'excited', label: 'Hào hứng', emoji: '🤩' },
  { value: 'tired', label: 'Mệt mỏi', emoji: '😴' },
  { value: 'anxious', label: 'Lo lắng', emoji: '😰' },
  { value: 'grateful', label: 'Biết ơn', emoji: '🙏' },
]

const moodLabels: Record<string, string> = {
  happy: 'Vui vẻ',
  sad: 'Buồn',
  calm: 'Bình yên',
  stressed: 'Căng thẳng',
  excited: 'Hào hứng',
  tired: 'Mệt mỏi',
  anxious: 'Lo lắng',
  grateful: 'Biết ơn',
}

export default function MoodPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [intensity, setIntensity] = useState(2)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const today = getTodayDate()
  const { data: todayMood, mutate } = useSWR('/api/moods/today', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleEdit = (event: any) => {
    setEditingEventId(event.id)
    setSelectedMood(event.mood)
    setIntensity(event.intensity)
    setNote(event.note || '')
  }

  const handleCancelEdit = () => {
    setEditingEventId(null)
    setSelectedMood('')
    setIntensity(2)
    setNote('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMood) {
      toast.error('Vui lòng chọn mood')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood: selectedMood, 
          intensity, 
          note, 
          eventId: editingEventId || undefined 
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(editingEventId ? 'Đã cập nhật mood!' : 'Đã thêm mood!')
        mutate()
        handleCancelEdit()
      } else {
        toast.error(data.error || 'Lỗi khi lưu mood')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (status === 'loading') {
    return <HeartLoader />
  }

  const myEvents = todayMood?.events?.me || []
  const partnerEvents = todayMood?.events?.partner || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <h1 className="text-4xl font-bold mb-8 text-foreground flex items-center gap-2">
          Mood hôm nay ({today})
        </h1>

        {/* Add/Edit Mood Form */}
        <div className="glass-card p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-primary border-b border-border pb-4">
            {editingEventId ? 'Sửa mood' : 'Thêm mood mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-4">
                Chọn mood của bạn
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`p-4 rounded-xl border transition ${
                      selectedMood === mood.value
                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'border-border bg-secondary/30 hover:bg-secondary'
                    }`}
                  >
                    <div className="text-4xl mb-3 drop-shadow-sm">{mood.emoji}</div>
                    <div className="text-sm font-bold text-foreground">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Cường độ: <span className="text-primary font-bold">{intensity}</span>
              </label>
              <input
                type="range"
                min="0"
                max="3"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-foreground/50 mt-3 font-medium">
                <span>Nhẹ</span>
                <span>Vừa</span>
                <span>Mạnh</span>
                <span>Rất mạnh</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-5 py-4 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/40 bg-background shadow-inner resize-none"
                placeholder="Thêm ghi chú về mood của bạn..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !selectedMood}
                className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-primary/30 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingEventId ? 'Cập nhật mood' : 'Thêm mood'}
              </button>
              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3.5 glass hover:bg-secondary rounded-xl text-foreground font-medium transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mood Events Timeline */}
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">Mood của bạn hôm nay</h2>
          
          {myEvents.length > 0 ? (
            <div className="space-y-4">
              {myEvents.map((event: any) => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl border border-border hover:-translate-y-1 transition-transform">
                  <span className="text-4xl drop-shadow-sm">{moods.find(m => m.value === event.mood)?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap md:flex-nowrap gap-3">
                      <span className="font-bold text-foreground text-lg">{moodLabels[event.mood]}</span>
                      <span className="text-xs text-foreground/60 font-semibold px-2 py-1 bg-background rounded-md border border-border">Cường độ: {event.intensity}</span>
                      <span className="text-xs text-foreground/50 ml-auto font-mono mt-1 md:mt-0">{formatTime(event.createdAt)}</span>
                    </div>
                    {event.note && (
                      <p className="text-foreground/80 mt-3 italic border-l-2 border-primary/30 pl-3 leading-relaxed">&quot;{event.note}&quot;</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-primary hover:text-accent text-sm font-bold bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition"
                  >
                    Sửa
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-center py-6 font-medium">Chưa có mood nào hôm nay</p>
          )}

          {partnerEvents.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">Mood của người ấy</h3>
              <div className="space-y-4">
                {partnerEvents.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl border border-border hover:-translate-y-1 transition-transform">
                    <span className="text-4xl drop-shadow-sm">{moods.find(m => m.value === event.mood)?.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap md:flex-nowrap gap-3">
                        <span className="font-bold text-foreground text-lg">{moodLabels[event.mood]}</span>
                        <span className="text-xs text-foreground/60 font-semibold px-2 py-1 bg-background rounded-md border border-border">Cường độ: {event.intensity}</span>
                        <span className="text-xs text-foreground/50 ml-auto font-mono mt-1 md:mt-0">{formatTime(event.createdAt)}</span>
                      </div>
                      {event.note && (
                        <p className="text-foreground/80 mt-3 italic border-l-2 border-primary/30 pl-3 leading-relaxed">&quot;{event.note}&quot;</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
