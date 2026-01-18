'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { getTodayDate } from '@/lib/utils'

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  const myEvents = todayMood?.events?.me || []
  const partnerEvents = todayMood?.events?.partner || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Mood hôm nay ({today})
        </h1>

        {/* Add/Edit Mood Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {editingEventId ? 'Sửa mood' : 'Thêm mood mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Chọn mood của bạn
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedMood === mood.value
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{mood.emoji}</div>
                    <div className="text-sm font-medium text-gray-900">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cường độ: {intensity}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Nhẹ</span>
                <span>Vừa</span>
                <span>Mạnh</span>
                <span>Rất mạnh</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
                placeholder="Thêm ghi chú về mood của bạn..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !selectedMood}
                className="flex-1 bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingEventId ? 'Cập nhật mood' : 'Thêm mood'}
              </button>
              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mood Events Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Mood của bạn hôm nay</h2>
          
          {myEvents.length > 0 ? (
            <div className="space-y-3">
              {myEvents.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{moods.find(m => m.value === event.mood)?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{moodLabels[event.mood]}</span>
                      <span className="text-sm text-gray-500">(Cường độ: {event.intensity})</span>
                      <span className="text-xs text-gray-400 ml-auto">{formatTime(event.createdAt)}</span>
                    </div>
                    {event.note && (
                      <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-pink-500 hover:text-pink-600 text-sm font-semibold"
                  >
                    Sửa
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có mood nào hôm nay</p>
          )}

          {partnerEvents.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Mood của người ấy</h3>
              <div className="space-y-3">
                {partnerEvents.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{moods.find(m => m.value === event.mood)?.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{moodLabels[event.mood]}</span>
                        <span className="text-sm text-gray-500">(Cường độ: {event.intensity})</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatTime(event.createdAt)}</span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-gray-600 mt-1">{event.note}</p>
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
