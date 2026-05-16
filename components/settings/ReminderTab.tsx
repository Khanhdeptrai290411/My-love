'use client'

import { useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { Plus, Save, X as XIcon, Edit2, Trash2, Calendar, Clock, Sparkles } from 'lucide-react'
import DateInput, { formatDateForDisplay } from '@/components/DateInput'

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const EMOJIS = ['💖', '🌸', '🎁', '🎂', '🥰', '✨', '💌', '😘', '🎉', '🌟', '🔔', '🌹']

const formatDateTimeLocal = (dateStr: string) => {
  // Not needed anymore since we separate date and time
  return dateStr
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
    remindStartTime: '08:00',
    remindEndTime: '20:00',
    icon: '✨',
    isActive: true
  })

  const handleEdit = (r: any) => {
    setForm({
      id: r._id,
      title: r.title,
      content: r.content,
      startDate: r.startDate,
      endDate: r.endDate,
      remindStartTime: r.remindStartTime || '08:00',
      remindEndTime: r.remindEndTime || '20:00',
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
              setForm({ id: '', title: '', content: '', startDate: '', endDate: '', remindStartTime: '08:00', remindEndTime: '20:00', icon: '✨', isActive: true })
              setIsAdding(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-semibold text-sm"
          >
            <Plus size={16} /> Thêm mới
          </button>
        )}
      </div>

      {/* Hobby Plan Warning - More Compact and Collapsible */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <span className="text-amber-500">⚠️</span>
              <span className="text-sm font-bold text-amber-900 dark:text-amber-200">Gói miễn phí Vercel Hobby</span>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-4 pb-4 pt-0 text-xs text-amber-800/80 dark:text-amber-300/60 leading-relaxed border-t border-amber-200/30 dark:border-amber-900/20 mt-1 italic">
            Thông báo sẽ được gom vào digest hàng ngày (khoảng 21:00). 
            Giờ nhắc chỉ dùng để hiển thị nội dung. 
            <p className="mt-1 font-medium text-amber-700 dark:text-amber-400 underline decoration-dotted">Muốn nhắc đúng phút cần nâng cấp hệ thống scheduler.</p>
          </div>
        </details>
      </div>

      {isAdding && (
        <div className="bg-secondary/30 rounded-3xl p-6 md:p-8 border border-border animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              {form.id ? '✨ Sửa lời nhắc' : '✨ Tạo lời nhắc mới'}
            </h4>
            <button onClick={() => setIsAdding(false)} className="text-foreground/40 hover:text-foreground"><XIcon size={24}/></button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/70 ml-1">Tiêu đề</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Ví dụ: Nhắc uống thuốc..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/70 ml-1">Nội dung</label>
                  <textarea
                    required
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="Nội dung nhắc nhở..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 ml-1">Ngày bắt đầu</label>
                    <DateInput
                      required
                      value={form.startDate}
                      onChange={val => setForm({...form, startDate: val})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 ml-1">Ngày kết thúc</label>
                    <DateInput
                      required
                      value={form.endDate}
                      onChange={val => setForm({...form, endDate: val})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 ml-1">Giờ bắt đầu</label>
                    <input
                      required
                      type="time"
                      value={form.remindStartTime}
                      onChange={e => setForm({...form, remindStartTime: e.target.value})}
                      className="w-full bg-background/50 border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 ml-1">Giờ kết thúc</label>
                    <input
                      required
                      type="time"
                      value={form.remindEndTime}
                      onChange={e => setForm({...form, remindEndTime: e.target.value})}
                      className="w-full bg-background/50 border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground/70 ml-1">Biểu tượng (Icon)</label>
              <div className="flex flex-wrap gap-2 p-3 bg-background/30 rounded-2xl border border-border/50">
                {EMOJIS.map(emoji => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setForm({...form, icon: emoji})}
                    className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${form.icon === emoji ? 'bg-primary/20 border-primary scale-110 shadow-lg shadow-primary/20' : 'bg-background/50 border-border hover:bg-secondary'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-12 h-6 rounded-full bg-secondary border border-border group-hover:border-primary/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={e => setForm({...form, isActive: e.target.checked})}
                    className="sr-only"
                  />
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-300 ${form.isActive ? 'translate-x-6 bg-primary shadow-md shadow-primary/50' : 'bg-foreground/30'}`} />
                </div>
                <span className="font-bold text-sm text-foreground/80">Kích hoạt lời nhắc</span>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? '⏳ ĐANG LƯU...' : '💾 LƯU LỜI NHẮC'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.reminders?.map((r: any) => (
          <div 
            key={r._id} 
            className={`relative group bg-card/40 backdrop-blur-sm border border-border rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 ${!r.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
          >
            <div className="flex gap-5">
              {/* Left Side: Icon */}
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-4xl md:text-5xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                {r.icon || '✨'}
              </div>

              {/* Right Side: Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-black text-xl text-foreground truncate group-hover:text-primary transition-colors">
                    {r.title}
                  </h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => handleEdit(r)} 
                      className="p-2 text-foreground/30 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(r._id)} 
                      className="p-2 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/60">
                    <Calendar size={14} className="text-primary" />
                    <span>{formatDateForDisplay(r.startDate)} - {formatDateForDisplay(r.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/60">
                    <Clock size={14} className="text-accent" />
                    <span>Mỗi ngày {formatTimeForDisplay(r.remindStartTime)} - {formatTimeForDisplay(r.remindEndTime)}</span>
                  </div>
                </div>

                {r.content && (
                  <p className="mt-4 text-sm text-foreground/80 italic leading-relaxed line-clamp-3 break-words bg-secondary/30 p-3 rounded-xl border border-border/50">
                    &quot;{r.content}&quot;
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${r.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-foreground/30'}`} />
                <span className={`text-xs font-black uppercase tracking-wider ${r.isActive ? 'text-emerald-500' : 'text-foreground/40'}`}>
                  {r.isActive ? 'Đang kích hoạt' : 'Đã tạm tắt'}
                </span>
              </div>
              
              <button 
                onClick={() => handleToggleActive(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${r.isActive ? 'bg-secondary text-foreground hover:bg-foreground hover:text-background' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105'}`}
              >
                {r.isActive ? 'Tắt ngay' : 'Bật lại'}
              </button>
            </div>
          </div>
        ))}
        
        {(!data?.reminders || data.reminders.length === 0) && !isAdding && (
          <div className="col-span-full py-20 text-center glass-card border-dashed">
            <div className="text-6xl mb-6 grayscale opacity-30">🔔</div>
            <p className="text-lg font-bold text-foreground/40 mb-2">Chưa có lời nhắc nào được tạo</p>
            <p className="text-sm text-foreground/30 px-6">Hãy tạo một lời nhắc để người ấy bất ngờ mỗi ngày nhé! 💖</p>
          </div>
        )}
      </div>
    </div>
  )
}
