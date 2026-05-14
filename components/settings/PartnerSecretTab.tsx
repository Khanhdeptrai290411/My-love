'use client'

import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Camera, Save, X as XIcon, Edit2, Copy, Heart } from 'lucide-react'

export default function PartnerSecretTab({ partnerData, isCreator }: { partnerData: any, isCreator: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    height: partnerData?.height || '',
    weight: partnerData?.weight || '',
    shoeSize: partnerData?.shoeSize || '',
    clothingSize: partnerData?.clothingSize || '',
    ringSize: partnerData?.ringSize || '',
    measurements: {
      bust: partnerData?.measurements?.bust || '',
      waist: partnerData?.measurements?.waist || '',
      hips: partnerData?.measurements?.hips || '',
    }
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/couple/partner-secret', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Lỗi khi lưu')
      toast.success('Đã lưu bí mật thành công! 🤫')
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // The current route `/api/couple/partner-secret` actually modifies partner data.
  // Wait, the previous implementation in page.tsx updated `profileForm` via `/api/couple/partner-secret`?
  // Let me check what the old page.tsx used. It used `/api/user/profile` for my info, but did it allow editing partner info?
  // I will check the previous page.tsx implementation!
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-secondary/30 rounded-2xl border border-border">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-background shadow-lg relative">
            <Image
              src={partnerData?.image || '/placeholder-user.jpg'}
              alt={partnerData?.name || 'Partner'}
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-full shadow-md text-primary animate-pulse">
            <Heart className="fill-primary" size={20} />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            {partnerData?.name || 'Người ấy'}
          </h3>
          <p className="text-foreground/60">{partnerData?.email}</p>
          <div className="pt-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium text-sm"
              >
                <Edit2 size={16} /> Chỉnh sửa bí mật
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl transition-colors font-medium text-sm"
              >
                <XIcon size={16} /> Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background rounded-2xl p-6 border border-border">
        <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
          <span>📏</span> Số đo cơ thể
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
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Ví dụ: 165"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Cân nặng (kg)</label>
                <input
                  type="text"
                  value={form.weight}
                  onChange={e => setForm({...form, weight: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Ví dụ: 50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Size quần áo</label>
                <input
                  type="text"
                  value={form.clothingSize}
                  onChange={e => setForm({...form, clothingSize: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Ví dụ: M, L..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Size giày</label>
                <input
                  type="text"
                  value={form.shoeSize}
                  onChange={e => setForm({...form, shoeSize: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Ví dụ: 38"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Size nhẫn</label>
                <input
                  type="text"
                  value={form.ringSize}
                  onChange={e => setForm({...form, ringSize: e.target.value})}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : <><Save size={20} /> Lưu thay đổi</>}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoItem label="Chiều cao" value={partnerData?.height ? `${partnerData.height} cm` : '--'} />
            <InfoItem label="Cân nặng" value={partnerData?.weight ? `${partnerData.weight} kg` : '--'} />
            <InfoItem label="Size quần áo" value={partnerData?.clothingSize || '--'} />
            <InfoItem label="Size giày" value={partnerData?.shoeSize || '--'} />
            <InfoItem label="Size nhẫn" value={partnerData?.ringSize || '--'} />
            
            <div className="col-span-2 md:col-span-3 pt-4 border-t border-border">
              <span className="text-sm text-foreground/50 block mb-2 font-medium">Số đo 3 vòng</span>
              <div className="flex gap-6">
                <span className="text-primary font-semibold">V1: {partnerData?.measurements?.bust || '--'}</span>
                <span className="text-primary font-semibold">V2: {partnerData?.measurements?.waist || '--'}</span>
                <span className="text-primary font-semibold">V3: {partnerData?.measurements?.hips || '--'}</span>
              </div>
            </div>
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
