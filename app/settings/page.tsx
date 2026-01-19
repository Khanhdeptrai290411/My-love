'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

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
      })
    }
  }, [profileData])

  // Check if current user is the creator (first member)
  const isCreator = coupleData?.couple?.members?.[0]?.email === session?.user?.email

  const handleUpdateStartDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate) {
      toast.error('Vui lòng nhập ngày hẹn hò')
      return
    }

    setSaving(true)
    try {
      console.log('📤 Sending request to update startDate:', startDate)
      const res = await fetch('/api/couple/update-start-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate }),
      })

      const data = await res.json()
      console.log('📥 Response status:', res.status, 'Response data:', data)
      console.log('📥 Response couple.startDate:', data.couple?.startDate)
      
      if (res.ok) {
        toast.success('Đã cập nhật ngày hẹn hò!')
        setIsEditingDate(false)
        
        // Update local state immediately with the response value
        const newStartDate = data.couple?.startDate || startDate
        setStartDate(newStartDate)
        console.log('✅ Updated local state, startDate:', newStartDate)
        
        // Manually update the SWR cache with the new data
        if (data.couple?.startDate && coupleData?.couple) {
          mutate({
            couple: {
              ...coupleData.couple,
              startDate: data.couple.startDate,
              inviteCode: data.couple.inviteCode,
            }
          }, false) // false = don't revalidate, use the data we provide
        }
        
        // Also force revalidation to fetch fresh data from server
        setTimeout(() => {
          mutate(undefined, { revalidate: true })
        }, 100)
      } else {
        console.error('❌ API error:', data.error)
        toast.error(data.error || 'Lỗi khi cập nhật')
      }
    } catch (error) {
      console.error('❌ Request error:', error)
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Cài đặt</h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Thông tin tài khoản</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                >
                  ✏️ Đổi
                </button>
              )}
            </div>

            {isEditingProfile && profileForm ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-4">
                  {profileForm.image ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={profileForm.image}
                        alt={profileForm.name || 'Avatar'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold text-xl">
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
                          const formData = new FormData()
                          formData.append('file', file)
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', body: formData })
                            const data = await res.json()
                            if (res.ok) {
                              setProfileForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      image: data.url,
                                    }
                                  : prev
                              )
                            } else {
                              toast.error(data.error || 'Upload ảnh thất bại')
                            }
                          } catch (error) {
                            toast.error('Có lỗi xảy ra khi upload ảnh')
                          }
                        }
                        input.click()
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                      Đổi ảnh đại diện
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => (prev ? { ...prev, email: e.target.value } : prev))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={profileForm.gender || ''}
                      onChange={(e) =>
                        setProfileForm((prev) =>
                          prev ? { ...prev, gender: e.target.value } : prev
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white text-sm"
                    >
                      <option value="">Chưa chọn</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false)
                      // Reset form to original values
                      if (profileData?.user) {
                        setProfileForm({
                          name: profileData.user.name || '',
                          email: profileData.user.email || '',
                          gender: profileData.user.gender || '',
                          image: profileData.user.image || '',
                        })
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                  >
                    {profileSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {profileData?.user?.image ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={profileData.user.image}
                        alt={profileData.user.name || 'Avatar'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold text-xl">
                      {profileData?.user?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-gray-800">
                      <span className="font-medium text-gray-900">Tên:</span>{' '}
                      <span className="text-gray-700">{profileData?.user?.name || session?.user?.name}</span>
                    </p>
                    <p className="text-gray-800">
                      <span className="font-medium text-gray-900">Email:</span>{' '}
                      <span className="text-gray-700">{profileData?.user?.email || session?.user?.email}</span>
                    </p>
                    <p className="text-gray-800">
                      <span className="font-medium text-gray-900">Giới tính:</span>{' '}
                      <span className="text-gray-700">
                        {profileData?.user?.gender === 'male'
                          ? 'Nam'
                          : profileData?.user?.gender === 'female'
                          ? 'Nữ'
                          : profileData?.user?.gender === 'other'
                          ? 'Khác'
                          : 'Chưa cập nhật'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {coupleData?.couple && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Mối quan hệ</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu mối quan hệ
                  </label>
                  {isEditingDate && isCreator ? (
                    <form onSubmit={handleUpdateStartDate} className="flex gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDate(false)
                          setStartDate(coupleData.couple.startDate || '')
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                      >
                        Hủy
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-700">
                        {coupleData.couple.startDate 
                          ? format(new Date(coupleData.couple.startDate), 'dd/MM/yyyy')
                          : 'Chưa thiết lập'}
                      </p>
                      {coupleData.couple.startDate && !isCreator && (
                        <span className="text-xs text-gray-500">(Chỉ người tạo có thể sửa)</span>
                      )}
                      {isCreator && (
                        <button
                          onClick={() => setIsEditingDate(true)}
                          className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                        >
                          ✏️ {coupleData.couple.startDate ? 'Sửa' : 'Thiết lập'}
                        </button>
                      )}
                      {!coupleData.couple.startDate && !isCreator && (
                        <span className="text-xs text-gray-500">(Chờ người tạo thiết lập)</span>
                      )}
                    </div>
                  )}
                </div>
                {coupleData.couple.members?.length >= 2 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Người bạn yêu nhất
                    </label>
                    <div className="flex items-center gap-3">
                      {coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.image ? (
                        <Image
                          src={coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.image}
                          alt="Partner"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold">
                          {coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.name?.charAt(0).toUpperCase() || '❤️'}
                        </div>
                      )}
                      <p className="text-gray-800 font-semibold text-lg">
                        {coupleData.couple.members.find((m: any) => m.email !== session?.user?.email)?.name || 'Người yêu'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã mời
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-700 font-mono text-lg">{coupleData.couple.inviteCode}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coupleData.couple.inviteCode)
                          toast.success('Đã sao chép mã!')
                        }}
                        className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                      >
                        📋 Sao chép
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Hành động</h2>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

