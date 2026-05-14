'use client'

import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Save, X as XIcon, Edit2, Upload } from 'lucide-react'
import { useSWRConfig } from 'swr'

export default function MyInfoTab({ profileData }: { profileData: any }) {
  const { mutate } = useSWRConfig()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    name: profileData?.name || '',
    gender: profileData?.gender || '',
    height: profileData?.height || '',
    weight: profileData?.weight || '',
    shoeSize: profileData?.shoeSize || '',
    clothingSize: profileData?.clothingSize || '',
    ringSize: profileData?.ringSize || '',
    personalNote: profileData?.personalNote || '',
    measurements: {
      bust: profileData?.measurements?.bust || '',
      waist: profileData?.measurements?.waist || '',
      hips: profileData?.measurements?.hips || '',
    }
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Lỗi khi lưu thông tin')
      toast.success('Đã lưu thông tin cá nhân! ✨')
      mutate('/api/user/profile')
      mutate('/api/couple/me')
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-secondary/30 rounded-2xl border border-border">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-background shadow-lg relative">
            <Image
              src={profileData?.image || '/placeholder-user.jpg'}
              alt={profileData?.name || 'Me'}
              fill
              className="object-cover"
            />
          </div>
          {/* Add a fake upload button icon just for UI */}
          {isEditing && (
             <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer text-white">
                <Upload size={24} />
             </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          {!isEditing ? (
             <>
                <h3 className="text-2xl font-bold text-foreground">
                  {profileData?.name || 'Tên của bạn'}
                </h3>
                <p className="text-foreground/60">{profileData?.email}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Edit2 size={16} /> Chỉnh sửa thông tin
                  </button>
                </div>
             </>
          ) : (
            <div className="space-y-4">
              <input 
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tên của bạn"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-foreground/80 cursor-pointer">
                  <input type="radio" name="gender" value="male" checked={form.gender === 'male'} onChange={e => setForm({...form, gender: e.target.value})} className="text-primary focus:ring-primary accent-primary" />
                  Nam
                </label>
                <label className="flex items-center gap-2 text-foreground/80 cursor-pointer">
                  <input type="radio" name="gender" value="female" checked={form.gender === 'female'} onChange={e => setForm({...form, gender: e.target.value})} className="text-primary focus:ring-primary accent-primary" />
                  Nữ
                </label>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl transition-colors font-medium text-sm"
              >
                <XIcon size={16} /> Hủy
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-background rounded-2xl p-6 border border-border">
        <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
          <span>📝</span> Chi tiết cá nhân
        </h4>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Chiều cao (cm)</label>
                <input
                  type="text"
                  value={form.height}
                  onChange={e => setForm({...form, height: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ví dụ: 165"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Cân nặng (kg)</label>
                <input
                  type="text"
                  value={form.weight}
                  onChange={e => setForm({...form, weight: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ví dụ: 50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Size quần áo</label>
                <input
                  type="text"
                  value={form.clothingSize}
                  onChange={e => setForm({...form, clothingSize: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ví dụ: M, L..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Size giày</label>
                <input
                  type="text"
                  value={form.shoeSize}
                  onChange={e => setForm({...form, shoeSize: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ví dụ: 38"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground/80">Size nhẫn</label>
                <input
                  type="text"
                  value={form.ringSize}
                  onChange={e => setForm({...form, ringSize: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ví dụ: 10"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h5 className="text-sm font-bold text-foreground/80 mb-4">Số đo 3 vòng</h5>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/60">Vòng 1</label>
                  <input
                    type="text"
                    value={form.measurements.bust}
                    onChange={e => setForm({...form, measurements: {...form.measurements, bust: e.target.value}})}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/60">Vòng 2</label>
                  <input
                    type="text"
                    value={form.measurements.waist}
                    onChange={e => setForm({...form, measurements: {...form.measurements, waist: e.target.value}})}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/60">Vòng 3</label>
                  <input
                    type="text"
                    value={form.measurements.hips}
                    onChange={e => setForm({...form, measurements: {...form.measurements, hips: e.target.value}})}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-sm font-bold text-foreground/80 mb-4 block">Ghi chú cá nhân</label>
              <textarea
                value={form.personalNote}
                onChange={e => setForm({...form, personalNote: e.target.value})}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                placeholder="Ví dụ: Thích hoa hồng, dị ứng đậu phộng..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : <><Save size={20} /> Lưu thông tin</>}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoItem label="Chiều cao" value={profileData?.height ? `${profileData.height} cm` : '--'} />
              <InfoItem label="Cân nặng" value={profileData?.weight ? `${profileData.weight} kg` : '--'} />
              <InfoItem label="Size quần áo" value={profileData?.clothingSize || '--'} />
              <InfoItem label="Size giày" value={profileData?.shoeSize || '--'} />
              <InfoItem label="Size nhẫn" value={profileData?.ringSize || '--'} />
              
              <div className="col-span-2 md:col-span-3 pt-4 border-t border-border">
                <span className="text-sm text-foreground/50 block mb-2 font-medium">Số đo 3 vòng</span>
                <div className="flex gap-6">
                  <span className="text-primary font-semibold">V1: {profileData?.measurements?.bust || '--'}</span>
                  <span className="text-primary font-semibold">V2: {profileData?.measurements?.waist || '--'}</span>
                  <span className="text-primary font-semibold">V3: {profileData?.measurements?.hips || '--'}</span>
                </div>
              </div>
            </div>

            {profileData?.personalNote && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-foreground/50 block mb-2 font-medium">Ghi chú cá nhân</span>
                <p className="text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3 py-1">
                  &quot;{profileData.personalNote}&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <span className="text-sm text-foreground/50 block mb-1 font-medium">{label}</span>
      <span className="text-primary font-semibold text-lg">{value}</span>
    </div>
  )
}
