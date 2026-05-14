'use client'

import { useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { Plus, Save, X as XIcon, Edit2, Trash2, Calendar, Clock, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const EMOJIS = ['💖', '🌸', '🎁', '🎂', '🥰', '✨', '💌', '😘', '🎉', '🌟', '🔔', '🌹']

const formatDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ReminderTab() {
  const { data, mutate } = useSWR('/api/reminders', fetcher)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    startDate: '',
    endDate: '',
    icon: '✨',
    isActive: true
  })

  const handleEdit = (r: any) => {
    setForm({
      id: r._id,
      title: r.title,
      content: r.content,
      startDate: formatDateTimeLocal(r.startDate),
      endDate: formatDateTimeLocal(r.endDate),
      icon: r.icon,
      isActive: r.isActive
    })
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lời nhắc này?')) return
    
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Lỗi khi xóa')
      toast.success('Đã xóa lời nhắc')
      mutate()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleToggleActive = async (r: any) => {
    try {
      const res = await fetch(`/api/reminders/${r._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !r.isActive })
      })
      if (!res.ok) throw new Error('Lỗi')
      mutate()
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const isUpdate = !!form.id
      const url = isUpdate ? `/api/reminders/${form.id}` : '/api/reminders'
      const method = isUpdate ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      if (!res.ok) throw new Error('Lỗi khi lưu lời nhắc')
      toast.success(isUpdate ? 'Cập nhật thành công!' : 'Đã tạo lời nhắc mới!')
      mutate()
      setIsAdding(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="text-primary" /> Lời nhắc nhở
        </h3>
        {!isAdding && (
          <button
            onClick={() => {
              setForm({ id: '', title: '', content: '', startDate: '', endDate: '', icon: '✨', isActive: true })
              setIsAdding(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-semibold text-sm"
          >
            <Plus size={16} /> Thêm mới
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-secondary/30 rounded-2xl p-6 border border-border">
          <h4 className="text-lg font-bold text-primary mb-4">
            {form.id ? 'Sửa lời nhắc' : 'Tạo lời nhắc mới'}
          </h4>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Tiêu đề</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ví dụ: Nhắc uống thuốc, Chúc ngủ ngon..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Nội dung</label>
              <textarea
                required
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Nội dung sẽ hiện lên màn hình..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Bắt đầu từ</label>
                <input
                  required
                  type="datetime-local"
                  value={form.startDate}
                  onChange={e => setForm({...form, startDate: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Kết thúc vào</label>
                <input
                  required
                  type="datetime-local"
                  value={form.endDate}
                  onChange={e => setForm({...form, endDate: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Biểu tượng (Icon)</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(emoji => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setForm({...form, icon: emoji})}
                    className={`text-2xl p-2 rounded-xl border transition-all ${form.icon === emoji ? 'bg-primary/20 border-primary scale-110' : 'bg-background border-border hover:bg-secondary/50'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={e => setForm({...form, isActive: e.target.checked})}
                  className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="font-medium text-foreground/80">Kích hoạt lời nhắc này</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold transition-colors hover:bg-secondary/80"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.reminders?.map((r: any) => (
          <div key={r._id} className={`glass-card p-5 border-l-4 ${r.isActive ? 'border-l-primary' : 'border-l-border opacity-60'} group relative`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{r.icon}</span>
                <div>
                  <h4 className="font-bold text-foreground text-lg line-clamp-1">{r.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {format(new Date(r.startDate), 'dd/MM HH:mm')} - {format(new Date(r.endDate), 'dd/MM HH:mm')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(r)} className="p-1.5 text-foreground/50 hover:text-primary transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(r._id)} className="p-1.5 text-foreground/50 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-foreground/80 mt-3 line-clamp-2 italic">&quot;{r.content}&quot;</p>
            
            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${r.isActive ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'}`}>
                {r.isActive ? 'Đang bật' : 'Đã tắt'}
              </span>
              <button 
                onClick={() => handleToggleActive(r)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {r.isActive ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </div>
        ))}
        {(!data?.reminders || data.reminders.length === 0) && !isAdding && (
          <div className="col-span-full text-center py-10 text-foreground/50">
            Chưa có lời nhắc nào. Hãy tạo một lời nhắc để tạo bất ngờ nhé! 💖
          </div>
        )}
      </div>
    </div>
  )
}
