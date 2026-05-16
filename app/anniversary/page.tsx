'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Heart, Plus, Calendar, Trash2, Clock } from 'lucide-react'
import HeartLoader from '@/components/HeartLoader'
import DateInput, { parseLocalDate } from '@/components/DateInput'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AnniversaryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, error, mutate, isLoading } = useSWR('/api/anniversary', fetcher)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return

    setSaving(true)
    try {
      const res = await fetch('/api/anniversary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, description }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success('Đã chạm khắc một kỷ niệm mới!')
        setIsAdding(false)
        setTitle('')
        setDate('')
        setDescription('')
        mutate()
      } else {
        toast.error(result.error || 'Lỗi khi thêm kỷ niệm')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kỷ niệm này?')) return
    try {
      const res = await fetch(`/api/anniversary/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã xóa kỷ niệm')
        mutate()
      } else {
        toast.error('Lỗi khi xóa')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  if (status === 'loading' || isLoading) {
    return <HeartLoader />
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            <Heart className="text-primary fill-primary animate-pulse" /> Góc Kỷ Niệm
          </h1>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition flex items-center gap-2 max-w-fit"
            >
              <Plus size={18} /> Thêm Mốc Thời Gian
            </button>
          )}
        </div>

        {isAdding && (
          <div className="glass-card p-6 md:p-8 mb-10 border border-primary/20">
            <h2 className="text-xl font-bold mb-6 text-foreground">Tạo Mốc Thời Gian Mới</h2>
            <form onSubmit={handleAddEvent} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Tên Tên sự kiện (VD: Sinh nhật bé yêu)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Ngày kỷ niệm</label>
                  <DateInput
                    value={date}
                    onChange={setDate}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Lời nhắn gửi (Tùy chọn)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-border bg-background min-h-[100px] resize-none"
                  placeholder="Gửi gắm chút ngọt ngào..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2.5 glass hover:bg-secondary rounded-xl font-medium transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Vào Tim'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.45rem] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:-z-10 before:bg-gradient-to-b before:from-primary/50 before:to-accent/50">
          {data?.events?.length > 0 ? (
            data.events.map((event: any, index: number) => {
              const eventDate = parseLocalDate(event.date)
              // Calculate past or future
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const diff = differenceInDays(today, eventDate)
              const formatDiff = () => {
                if (diff === 0) return 'Hôm nay'
                if (diff > 0) return `Đã qua ${diff} ngày`
                return `Còn ${Math.abs(diff)} ngày nữa`
              }

              return (
                <div key={event._id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${index === 0 ? 'mt-0' : ''}`}>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-gradient-to-tr from-primary to-accent text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Calendar size={20} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] glass-card p-6 border-b-4 border-b-primary group-hover:-translate-y-2 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{event.title}</h3>
                      {!event.isDefault && (
                        <button onClick={() => handleDelete(event._id)} className="text-foreground/40 hover:text-red-500 transition">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground/70 mb-3 font-medium">
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {format(eventDate, 'dd MMMM, yyyy', { locale: vi })}</span>
                      <span className="px-2 py-1 rounded-md bg-secondary text-primary text-xs font-bold font-mono">{formatDiff()}</span>
                    </div>
                    {event.description && (
                      <p className="text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3 py-1">&quot;{event.description}&quot;</p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-20">
              <p className="text-foreground/60 text-lg">Chưa có ngày kỷ niệm nào được lưu trữ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
