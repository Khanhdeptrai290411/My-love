'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { getTodayDate } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import LoveCounter from '@/components/LoveCounter'
import HeartLoader from '@/components/HeartLoader'
import CoupleStreak from '@/components/home/CoupleStreak'
import PartnerEmotionForecastCard from '@/components/home/PartnerEmotionForecastCard'

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

const fetcher = async (url: string) => {
  const res = await fetch(url)
  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [postContent, setPostContent] = useState('')
  const [postImages, setPostImages] = useState<{ url: string; publicId: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  // Mood states
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [intensity, setIntensity] = useState(2)
  const [note, setNote] = useState('')
  const [savingMood, setSavingMood] = useState(false)
  const [isEditingMood, setIsEditingMood] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const [postFilter, setPostFilter] = useState<'me' | 'partner' | 'both'>('both')

  const { data: couple, isLoading: coupleLoading } = useSWR('/api/couple/me', fetcher)

  useEffect(() => {
    if (!coupleLoading && couple && !couple?.couple) {
      router.push('/couple')
    }
  }, [coupleLoading, couple, router])


  const [postsSkip, setPostsSkip] = useState(0)
  const [accumulatedPosts, setAccumulatedPosts] = useState<any[]>([])
  const { data: postsResponse, isLoading: postsLoading, error: postsError, mutate: mutatePosts } = useSWR(
    `/api/posts?range=3month&filter=${postFilter}&limit=30&skip=${postsSkip}`,
    fetcher
  )
  useEffect(() => {
    if (!postsResponse?.posts) return
    if (postsSkip === 0) {
      setAccumulatedPosts(postsResponse.posts)
    } else {
      setAccumulatedPosts((prev) => [...prev, ...postsResponse.posts])
    }
  }, [postsResponse, postsSkip])
  useEffect(() => {
    setPostsSkip(0)
    setAccumulatedPosts([])
  }, [postFilter])

  const { data: moodMatchData, mutate: mutateMoodMatch } = useSWR('/api/mood-match/today', fetcher, {
    refreshInterval: 60000,
  })

  const handleSubmitMood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMood) {
      toast.error('Vui lòng chọn mood')
      return
    }

    setSavingMood(true)
    try {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood: selectedMood, 
          intensity, 
          note, 
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Đã lưu mood!')
        mutateMoodMatch()
        setIsEditingMood(false)
      } else {
        toast.error(data.error || 'Lỗi khi lưu mood')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSavingMood(false)
    }
  }

  // Pre-fill mood form if user already has a mood today and clicks Edit
  useEffect(() => {
    if (isEditingMood && moodMatchData?.moods?.me) {
      setSelectedMood(moodMatchData.moods.me.mood)
      setIntensity(moodMatchData.moods.me.intensity || 2)
    }
  }, [isEditingMood, moodMatchData])

  // Removed todayPost check - allow multiple posts per day

  const uploadImageFile = async (file: File) => {
    setUploading(true)
    try {
      // Compress ảnh trước khi upload để giảm kích thước và tăng tốc độ
      const { compressImage } = await import('@/lib/utils')
      const compressedFile = await compressImage(file, 2560, 2560, 0.92)

      const formData = new FormData()
      formData.append('file', compressedFile)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setPostImages((prev) => [...prev, { url: data.url, publicId: data.publicId }])
        toast.success('Upload ảnh thành công!')
      } else {
        toast.error(data.error || 'Upload thất bại')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi upload')
    } finally {
      setUploading(false)
    }
  }

  // Posts to display: ưu tiên accumulated (phân trang), nếu chưa có thì dùng cache từ SWR
  const displayPosts = accumulatedPosts.length > 0
    ? accumulatedPosts
    : postsResponse?.posts || []
  const hasAnyPosts = displayPosts.length > 0

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Upload song song để tăng tốc độ (nếu có nhiều ảnh)
    const uploadPromises = files.map((file) => uploadImageFile(file))
    await Promise.all(uploadPromises)

    // Reset input để chọn lại cùng file nếu muốn
    e.target.value = ''
  }

  const handlePasteImages = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items).filter((item) =>
      item.type.startsWith('image/')
    )
    if (!items.length) return

    e.preventDefault()

    // Upload song song các ảnh đã paste
    const files = items.map((item) => item.getAsFile()).filter((f): f is File => !!f)
    const uploadPromises = files.map((file) => uploadImageFile(file))
    await Promise.all(uploadPromises)
  }

  const handleRemoveImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index))
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }

    setSaving(true)
    try {
      // Always create new post (don't send postId)
      // Format images correctly (remove undefined publicId)
      const formattedImages = postImages.map(img => ({
        url: img.url,
        ...(img.publicId && { publicId: img.publicId })
      }))
      console.log('Submitting post with images:', formattedImages.length, formattedImages)
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent, images: formattedImages }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Đã đăng bài!')
        setPostContent('')
        setPostImages([])
        setPostsSkip(0)
        mutatePosts()
      } else {
        toast.error(data.error || 'Lỗi khi đăng bài')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || coupleLoading) {
    return <HeartLoader />
  }

  if (!couple?.couple) {
    return null
  }

  const hasPartner = couple.couple.members?.length >= 2

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Love Counter */}
        {couple?.couple?.startDate && hasPartner ? (
          <div className="glass-card mb-8 overflow-hidden relative shadow-lg shadow-primary/5">
            {/* Background blur effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 mix-blend-overlay"></div>
            <LoveCounter
              startDate={couple.couple.startDate}
              member1Name={couple.couple.members?.[0]?.name}

              member2Name={couple.couple.members?.[1]?.name}
              member1Image={couple.couple.members?.[0]?.image}
              member2Image={couple.couple.members?.[1]?.image}
            />
            <div className="relative z-10 pb-8">
              <CoupleStreak />
            </div>
          </div>
        ) : !hasPartner ? (
          <div className="glass-card mb-8 p-10 border border-primary/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Bạn chưa thiết lập người ấy</h2>
              <p className="text-foreground/70 mb-6">
                Vui lòng sao chép mã sau để gửi cho nửa kia của bạn:
              </p>
              <div className="bg-background rounded-2xl p-6 mb-6 border border-border shadow-sm inline-block mx-auto min-w-[250px]">
                <p className="text-4xl font-black text-primary tracking-widest mb-4">{couple.couple.inviteCode}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(couple.couple.inviteCode)
                    toast.success('Đã sao chép mã!')
                  }}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-xl font-semibold transition"
                >
                  📋 Sao chép mã
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Sau khi người yêu nhập mã này, hai bạn sẽ được kết nối với nhau.
              </p>
            </div>
          </div>
        ) : null}

        {/* Forecast Card */}
        <PartnerEmotionForecastCard 
          moodData={moodMatchData} 
          onCheckInClick={() => {
            setIsEditingMood(true)
            window.scrollTo({ top: document.getElementById('mood-checkin-section')?.offsetTop, behavior: 'smooth' })
          }} 
        />

        {/* Mood Match Card */}
        <div id="mood-checkin-section" className="glass-card mb-8 p-6 md:p-8 relative">
          <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              {moodMatchData?.message || 'Cảm xúc hôm nay'}
            </h2>
            {moodMatchData && moodMatchData.status !== 'NONE' && !isEditingMood && (
              <button
                onClick={() => setIsEditingMood(true)}
                className="p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors text-primary flex items-center justify-center w-10 h-10 shadow-sm"
                title="Sửa mood"
              >
                ✏️
              </button>
            )}
          </div>

          {(isEditingMood || !moodMatchData || moodMatchData.status === 'NONE' || (moodMatchData.status === 'ONE_SIDED' && !moodMatchData.moods.me)) ? (
            <form onSubmit={handleSubmitMood} className="space-y-6">
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
                  min="1"
                  max="4"
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
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingMood || !selectedMood}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-primary/30 transition disabled:opacity-50"
                >
                  {savingMood ? 'Đang lưu...' : 'Lưu mood'}
                </button>
                {moodMatchData && (moodMatchData.status !== 'NONE' && moodMatchData.moods.me) && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMood(false)}
                    className="px-6 py-3.5 glass hover:bg-secondary rounded-xl text-foreground font-medium transition"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="py-4 flex flex-col items-center justify-center text-center">
              <div className="flex justify-center gap-12 mb-6 w-full max-w-sm">
                {moodMatchData.moods.me && (
                  <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-2xl border border-border/50 flex-1">
                    <span className="text-5xl mb-3 drop-shadow-sm">{moods.find(m => m.value === moodMatchData.moods.me.mood)?.emoji}</span>
                    <span className="text-sm font-bold text-foreground/80">Bạn</span>
                  </div>
                )}
                {moodMatchData.moods.partner && (
                  <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-2xl border border-border/50 flex-1">
                    <span className="text-5xl mb-3 drop-shadow-sm">{moods.find(m => m.value === moodMatchData.moods.partner.mood)?.emoji}</span>
                    <span className="text-sm font-bold text-foreground/80">Người ấy</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Write Post Form */}
        <div className="glass-card mb-8 p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-6 text-primary flex items-center gap-2">✍️ Cập nhật nhật ký</h2>

          <form onSubmit={handleSubmitPost} className="space-y-5">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onPaste={handlePasteImages}
              className="w-full px-5 py-4 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent min-h-[140px] text-foreground placeholder:text-foreground/40 bg-background resize-none shadow-inner"
              placeholder="Hôm nay của bạn thế nào? Cùng chia sẻ nhé..."
            />

            {/* Image Upload Section */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  <span className="text-2xl">📷</span>
                  <span className="text-sm text-gray-700 font-medium">Album</span>
                </div>
              </label>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm text-gray-700 font-medium disabled:opacity-50"
              >
                <span className="text-2xl">📸</span>
                <span>Chụp ảnh</span>
              </button>
              {uploading && (
                <span className="text-sm text-gray-500">Đang upload...</span>
              )}
            </div>

            {/* Image Preview */}
            {postImages.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {postImages.map((img, index) => (
                  <div key={index} className="relative group bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '80px', maxHeight: '120px' }}>
                    {img.url.startsWith('data:') ? (
                      <img
                        src={img.url}
                        alt={`Upload ${index + 1}`}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        style={{ maxHeight: '120px' }}
                      />
                    ) : (
                      <Image
                        src={img.url}
                        alt={`Upload ${index + 1}`}
                        width={120}
                        height={120}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        style={{ maxHeight: '120px' }}
                        unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || uploading || !postContent.trim()}
                className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span>✏️</span>
                    <span>Đăng bài</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>







        {/* All Posts */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-4 sm:mb-0">Dòng thời gian</h2>
            <div className="flex gap-2 p-1 bg-secondary rounded-xl">
              <button
                onClick={() => setPostFilter('both')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${postFilter === 'both'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
                  }`}
              >
                Cả hai
              </button>
              <button
                onClick={() => setPostFilter('me')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${postFilter === 'me'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
                  }`}
              >
                Của tôi
              </button>
              <button
                onClick={() => setPostFilter('partner')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${postFilter === 'partner'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
                  }`}
              >
                Nửa kia
              </button>
            </div>
          </div>
          {postsLoading && !hasAnyPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : postsError && !hasAnyPosts ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-red-600 font-semibold mb-2">Không tải được bài đăng</p>
              <p className="text-gray-600 text-sm mb-4">
                {(postsError as any)?.message || 'Có lỗi xảy ra khi gọi /api/posts'}
              </p>
              <button
                type="button"
                onClick={() => mutatePosts()}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition text-sm font-semibold"
              >
                Thử lại
              </button>
            </div>
          ) : hasAnyPosts ? (
            <div className="space-y-4">
              {displayPosts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={() => {
                    setPostsSkip(0)
                    mutatePosts()
                  }}
                />
              ))}
              {postsResponse?.hasMore && (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    onClick={() => setPostsSkip((s) => s + 30)}
                    disabled={postsLoading}
                    className="px-6 py-2 bg-pink-100 text-pink-700 rounded-lg font-medium hover:bg-pink-200 transition disabled:opacity-50"
                  >
                    {postsLoading ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 mb-2">
                {postFilter === 'partner'
                  ? 'Người ấy chưa có bài đăng nào trong tháng này'
                  : postFilter === 'me'
                    ? 'Bạn chưa có bài đăng nào trong tháng này'
                    : 'Chưa có bài đăng nào'}
              </p>
              {postFilter === 'partner' && (
                <p className="text-sm text-gray-400">
                  (Có thể người ấy chưa đăng bài hoặc chưa join couple)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
