'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Camera, Save, X as XIcon, Edit2, LogOut, Copy, Heart } from 'lucide-react'
import HeartLoader from '@/components/HeartLoader'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<{
    name: string
    email: string
    gender: string
    image: string
    height: string
    weight: string
    shoeSize: string
    clothingSize: string
    ringSize: string
    measurements: { bust: string; waist: string; hips: string }
  } | null>(null)

  const { data: coupleData, mutate } = useSWR('/api/couple/me', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const { data: profileData, mutate: mutateProfile } = useSWR('/api/user/profile', fetcher)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (coupleData?.couple?.startDate) {
      setStartDate(coupleData.couple.startDate)
    } else {
      setStartDate('')
    }
  }, [coupleData])

  useEffect(() => {
    if (profileData?.user) {
      setProfileForm({
        name: profileData.user.name || '',
        email: profileData.user.email || '',
        gender: profileData.user.gender || '',
        image: profileData.user.image || '',
        height: profileData.user.height || '',
        weight: profileData.user.weight || '',
        shoeSize: profileData.user.shoeSize || '',
        clothingSize: profileData.user.clothingSize || '',
        ringSize: profileData.user.ringSize || '',
        measurements: {
          bust: profileData.user.measurements?.bust || '',
          waist: profileData.user.measurements?.waist || '',
          hips: profileData.user.measurements?.hips || '',
        }
      })
    }
  }, [profileData])

  const isCreator = coupleData?.couple?.members?.[0]?.email === session?.user?.email
  const partnerData = coupleData?.couple?.members?.find((m: any) => m.email !== session?.user?.email)
  const displayData = partnerData || profileData?.user

  const handleUpdateStartDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate) {
      toast.error('Vui lòng nhập ngày hẹn hò')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/couple/update-start-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate }),
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('Đã cập nhật ngày hẹn hò!')
        setIsEditingDate(false)
        const newStartDate = data.couple?.startDate || startDate
        setStartDate(newStartDate)
        
        if (data.couple?.startDate && coupleData?.couple) {
          mutate({
            couple: {
              ...coupleData.couple,
              startDate: data.couple.startDate,
              inviteCode: data.couple.inviteCode,
            }
          }, false)
        }
        setTimeout(() => mutate(undefined, { revalidate: true }), 100)
      } else {
        toast.error(data.error || 'Lỗi khi cập nhật')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm) return

    setProfileSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          gender: profileForm.gender || undefined,
          image: profileForm.image || undefined,
          height: profileForm.height || undefined,
          weight: profileForm.weight || undefined,
          shoeSize: profileForm.shoeSize || undefined,
          clothingSize: profileForm.clothingSize || undefined,
          ringSize: profileForm.ringSize || undefined,
          measurements: profileForm.measurements || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Đã cập nhật hồ sơ!')
        setIsEditingProfile(false)
        mutateProfile()
      } else {
        toast.error(data.error || 'Lỗi khi cập nhật hồ sơ')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setProfileSaving(false)
    }
  }

  if (status === 'loading') {
    return <HeartLoader />
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Hồ sơ cá nhân & Cài đặt</h1>

        <div className="glass-card p-6 md:p-8 space-y-10">
          {/* Profile Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                {isEditingProfile ? 'Thông tin của bạn' : (partnerData ? 'Bí mật về người ấy 🤫' : 'Thông tin tài khoản & Số đo')}
              </h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-1 text-primary hover:text-accent font-medium px-4 py-2 hover:bg-secondary rounded-xl transition"
                >
                  <Edit2 size={16} /> Chỉnh sửa
                </button>
              )}
            </div>

            {isEditingProfile && profileForm ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                  {profileForm.image ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-lg relative group">
                      <Image src={profileForm.image} alt={profileForm.name} width={96} height={96} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Camera className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-3xl shadow-lg relative group">
                      {profileForm.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={async () => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const { compressImage } = await import('@/lib/utils')
                            const compressedFile = await compressImage(file, 1200, 1200, 0.9)
                            const formData = new FormData()
                            formData.append('file', compressedFile)
                            const res = await fetch('/api/upload', { method: 'POST', body: formData })
                            const data = await res.json()
                            if (res.ok) {
                              setProfileForm((prev) => prev ? { ...prev, image: data.url } : prev)
                            } else {
                              toast.error(data.error || 'Upload ảnh thất bại')
                            }
                          } catch (error) {
                            toast.error('Có lỗi xảy ra khi upload')
                          }
                        }
                        input.click()
                      }}
                      className="px-5 py-2 glass hover:bg-secondary rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <Camera size={16} /> Thay đổi Avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/50 p-6 rounded-2xl border border-border">
                  <h3 className="col-span-full font-semibold text-lg text-primary">Thông tin cơ bản</h3>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Tên</label>
                    <input type="text" value={profileForm.name} onChange={(e) => setProfileForm(p => p ? { ...p, name: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
                    <input type="email" value={profileForm.email} onChange={(e) => setProfileForm(p => p ? { ...p, email: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Giới tính</label>
                    <select value={profileForm.gender || ''} onChange={(e) => setProfileForm(p => p ? { ...p, gender: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl">
                      <option value="">Chưa chọn</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-secondary/50 p-6 rounded-2xl border border-border">
                  <h3 className="col-span-full font-semibold text-lg text-primary">Chỉ số cá nhân (Để mua quà dễ hơn nè ❤️)</h3>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Chiều cao</label>
                    <input type="text" placeholder="1m65" value={profileForm.height} onChange={(e) => setProfileForm(p => p ? { ...p, height: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Cân nặng</label>
                    <input type="text" placeholder="50kg" value={profileForm.weight} onChange={(e) => setProfileForm(p => p ? { ...p, weight: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Size Giày</label>
                    <input type="text" placeholder="38" value={profileForm.shoeSize} onChange={(e) => setProfileForm(p => p ? { ...p, shoeSize: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Size Áo/Quần</label>
                    <input type="text" placeholder="L / M" value={profileForm.clothingSize} onChange={(e) => setProfileForm(p => p ? { ...p, clothingSize: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Size Cũi Ngón tay</label>
                    <input type="text" placeholder="Để mua nhẫn" value={profileForm.ringSize} onChange={(e) => setProfileForm(p => p ? { ...p, ringSize: e.target.value } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                  </div>
                  <div className="col-span-full md:col-span-3 grid grid-cols-3 gap-4">
                    <div className="col-span-full"><label className="block text-sm font-medium text-foreground/80 mb-1">Số Đo 3 Vòng</label></div>
                    <input type="text" placeholder="Vòng 1" value={profileForm.measurements.bust} onChange={(e) => setProfileForm(p => p ? { ...p, measurements: { ...p.measurements, bust: e.target.value } } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                    <input type="text" placeholder="Vòng 2" value={profileForm.measurements.waist} onChange={(e) => setProfileForm(p => p ? { ...p, measurements: { ...p.measurements, waist: e.target.value } } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                    <input type="text" placeholder="Vòng 3" value={profileForm.measurements.hips} onChange={(e) => setProfileForm(p => p ? { ...p, measurements: { ...p.measurements, hips: e.target.value } } : p)} className="w-full px-4 py-3 rounded-xl placeholder:text-foreground/40" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false)
                      if (profileData?.user) {
                        setProfileForm({
                          name: profileData.user.name || '',
                          email: profileData.user.email || '',
                          gender: profileData.user.gender || '',
                          image: profileData.user.image || '',
                          height: profileData.user.height || '',
                          weight: profileData.user.weight || '',
                          shoeSize: profileData.user.shoeSize || '',
                          clothingSize: profileData.user.clothingSize || '',
                          ringSize: profileData.user.ringSize || '',
                          measurements: {
                            bust: profileData.user.measurements?.bust || '',
                            waist: profileData.user.measurements?.waist || '',
                            hips: profileData.user.measurements?.hips || '',
                          }
                        })
                      }
                    }}
                    className="px-6 py-2.5 glass hover:bg-secondary rounded-xl font-medium transition flex items-center gap-2"
                  >
                    <XIcon size={18} /> Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-primary/30 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {profileSaving ? 'Đang lưu...' : <><Save size={18} /> Cập nhật</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 items-start bg-secondary/30 p-6 rounded-2xl relative">
                {partnerData && (
                  <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                    Thông tin của đối phương
                  </div>
                )}
                {displayData?.image ? (
                  <Image
                    src={displayData.image}
                    alt={displayData.name || 'Avatar'}
                    width={112}
                    height={112}
                    className="rounded-full shadow-lg border-4 border-background object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-background flex-shrink-0">
                    {displayData?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mt-4 md:mt-0">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/60 font-medium">Họ và tên</p>
                    <p className="text-lg font-semibold">{displayData?.name || session?.user?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/60 font-medium">Email</p>
                    <p className="text-lg font-semibold">{displayData?.email || session?.user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/60 font-medium">Chiều cao / Cân nặng</p>
                    <p className="font-semibold text-primary">{displayData?.height || '-'} <span className="text-foreground">/</span> {displayData?.weight || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/60 font-medium">Size quần áo / Giày</p>
                    <p className="font-semibold text-primary">{displayData?.clothingSize || '-'} <span className="text-foreground">/</span> {displayData?.shoeSize || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/60 font-medium">Số đo 3 vòng</p>
                    <p className="font-semibold text-primary">
                      {displayData?.measurements?.bust || '-'} <span className="text-foreground">-</span> {displayData?.measurements?.waist || '-'} <span className="text-foreground">-</span> {displayData?.measurements?.hips || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/60 font-medium">Size Nhẫn (Ngón tay)</p>
                    <p className="font-semibold text-primary">{displayData?.ringSize || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <hr className="border-border" />

          {/* Relationship Section */}
          {coupleData?.couple && (
            <section>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                <Heart className="text-primary fill-primary" /> Mối quan hệ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                  <label className="block text-sm font-medium text-foreground/70 mb-3">Ngày bắt đầu</label>
                  {isEditingDate && isCreator ? (
                    <form onSubmit={handleUpdateStartDate} className="flex gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="flex-1 px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        required
                      />
                      <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:opacity-90 transition">Lưu</button>
                      <button type="button" onClick={() => setIsEditingDate(false)} className="px-4 py-2 glass rounded-xl font-medium">Hủy</button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold text-foreground">
                        {coupleData.couple.startDate ? format(new Date(coupleData.couple.startDate), 'dd/MM/yyyy') : 'Chưa thiết lập'}
                      </p>
                      {isCreator ? (
                        <button onClick={() => setIsEditingDate(true)} className="text-primary hover:bg-secondary p-2 rounded-lg transition"><Edit2 size={16} /></button>
                      ) : (
                        <span className="text-xs text-foreground/50 bg-secondary px-2 py-1 rounded-md hidden md:block">Bạn đời sẽ thiết lập mục này</span>
                      )}
                    </div>
                  )}
                </div>

                {coupleData.couple.members?.length >= 2 ? (
                  <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                    <label className="block text-sm font-medium text-foreground/70 mb-3">Người ấy của bạn</label>
                    <div className="flex items-center gap-4">
                      {coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.image ? (
                        <Image src={coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.image} alt="Partner" width={48} height={48} className="rounded-full shadow-md object-cover border-2 border-background" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-background">❤️</div>
                      )}
                      <p className="text-foreground font-bold text-xl">
                        {coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.name || 'Người yêu'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                    <label className="block text-sm font-medium text-foreground/70 mb-3">Mã mời người ấy</label>
                    <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border">
                      <p className="text-primary font-mono font-bold text-xl tracking-widest flex-1 text-center">{coupleData.couple.inviteCode}</p>
                      <button onClick={() => { navigator.clipboard.writeText(coupleData.couple.inviteCode); toast.success('Đã sao chép mã!') }} className="bg-primary/10 text-primary hover:bg-primary/20 p-2 text-sm rounded-lg font-semibold flex gap-2 items-center transition">
                        <Copy size={16} /> Sao chép
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <hr className="border-border" />

          {/* Action Section */}
          <section className="flex justify-end">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm border border-red-100"
            >
              <LogOut size={20} /> Đăng xuất khỏi hệ thống
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
