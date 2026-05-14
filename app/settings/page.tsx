'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Edit2, LogOut, Copy, Heart } from 'lucide-react'
import HeartLoader from '@/components/HeartLoader'
import ProfileTabs from '@/components/settings/ProfileTabs'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: coupleData, mutate } = useSWR('/api/couple/me', fetcher, {
    revalidateOnFocus: true,
  })

  const { data: profileData } = useSWR('/api/user/profile', fetcher)

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

  const isCreator = coupleData?.couple?.creatorId === session?.user?.id || coupleData?.couple?.members?.[0]?.email === session?.user?.email
  const partnerData = coupleData?.couple?.members?.find((m: any) => m.email !== session?.user?.email)

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
        mutate()
      } else {
        toast.error(data.error || 'Lỗi khi cập nhật')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || !profileData || !coupleData) {
    return <HeartLoader />
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20 space-y-10">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Hồ sơ cá nhân & Cài đặt</h1>

        {/* Tab Section */}
        <ProfileTabs 
          partnerData={partnerData} 
          profileData={profileData?.user} 
          isCreator={isCreator} 
        />

        {/* Relationship Section */}
        {coupleData?.couple && (
          <section className="glass-card p-6 md:p-8">
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
                      className="flex-1 px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground [color-scheme:dark]"
                      required
                    />
                    <button type="submit" disabled={saving} className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition">Lưu</button>
                    <button type="button" onClick={() => setIsEditingDate(false)} className="px-4 py-2 bg-secondary text-foreground rounded-xl font-medium">Hủy</button>
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
                    {partnerData?.image ? (
                      <Image src={partnerData.image} alt="Partner" width={48} height={48} className="rounded-full shadow-md object-cover border-2 border-background" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-background">❤️</div>
                    )}
                    <p className="text-foreground font-bold text-xl">
                      {partnerData?.name || 'Người yêu'}
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

        {/* Action Section */}
        <section className="flex justify-end">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm border border-red-500/20"
          >
            <LogOut size={20} /> Đăng xuất khỏi hệ thống
          </button>
        </section>
      </div>
    </div>
  )
}
