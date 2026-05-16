'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import HeartLoader from '@/components/HeartLoader'
import { Camera, Image as ImageIcon, Heart, Star, Sparkles, Smile, MessageSquare, ArrowLeft } from 'lucide-react'
import { formatDateForDisplay } from '@/components/DateInput'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const MOOD_TYPES = ['happy', 'sad', 'calm', 'stressed', 'excited', 'tired', 'anxious', 'grateful'] as const

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  calm: '😌',
  stressed: '😣',
  excited: '🤩',
  tired: '😴',
  anxious: '😰',
  grateful: '🙏',
}

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

export default function DayDetailPage({ params }: { params: { date: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { date } = params

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: dayData, isLoading, mutate: mutateDay } = useSWR(`/api/day?date=${date}`, fetcher)
  const { mutate: globalMutate } = useSWRConfig()

  // Form: cập nhật mood cho ngày này
  const [moodType, setMoodType] = useState<string>('happy')
  const [moodIntensity, setMoodIntensity] = useState(2)
  const [moodNote, setMoodNote] = useState('')
  const [savingMood, setSavingMood] = useState(false)

  // Form: thêm bài đăng cho ngày này
  const [postContent, setPostContent] = useState('')
  const [postImages, setPostImages] = useState<{ url: string; publicId?: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [savingPost, setSavingPost] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  // Pre-fill mood form when dayData has my mood
  useEffect(() => {
    if (dayData?.moods?.me) {
      setMoodType(dayData.moods.me.mood || 'happy')
      setMoodIntensity(dayData.moods.me.intensity ?? 2)
      setMoodNote(dayData.moods.me.note || '')
    }
  }, [dayData?.moods?.me])

  const uploadImageFile = async (file: File) => {
    setUploading(true)
    try {
      const { compressImage } = await import('@/lib/utils')
      const compressedFile = await compressImage(file, 2560, 2560, 0.92)

      const formData = new FormData()
      formData.append('file', compressedFile)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setPostImages((prev) => [...prev, { url: data.url, publicId: data.publicId }])
        toast.success('Thêm ảnh thành công!')
      } else {
        toast.error(data.error || 'Upload thất bại')
      }
    } catch {
      toast.error('Có lỗi khi upload')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const uploadPromises = files.map((file) => uploadImageFile(file))
    await Promise.all(uploadPromises)
    e.target.value = ''
  }

  const handlePasteImages = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items).filter((item) => item.type.startsWith('image/'))
    if (!items.length) return
    e.preventDefault()
    const files = items.map((item) => item.getAsFile()).filter((f): f is File => !!f)
    const uploadPromises = files.map((file) => uploadImageFile(file))
    await Promise.all(uploadPromises)
  }

  const handleSubmitMood = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMood(true)
    try {
      const body = dayData?.moods?.me?.id
        ? { eventId: dayData.moods.me.id, mood: moodType, intensity: moodIntensity, note: moodNote }
        : { date, mood: moodType, intensity: moodIntensity, note: moodNote }
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(dayData?.moods?.me ? 'Đã cập nhật mood!' : 'Đã thêm mood cho ngày này!')
        mutateDay()
        const year = date ? date.substring(0, 4) : new Date().getFullYear().toString()
        globalMutate(`/api/review?year=${year}&view=couple`, undefined, { revalidate: true })
        globalMutate(`/api/review?year=${year}&view=me`, undefined, { revalidate: true })
        globalMutate(`/api/review?year=${year}&view=partner`, undefined, { revalidate: true })
      } else {
        toast.error(data.error || 'Lỗi khi lưu mood')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSavingMood(false)
    }
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }
    setSavingPost(true)
    try {
      const formattedImages = postImages.map((img) => ({
        url: img.url,
        ...(img.publicId && { publicId: img.publicId }),
      }))
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent.trim(), images: formattedImages, date }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Đã thêm bài đăng cho ngày này!')
        setPostContent('')
        setPostImages([])
        mutateDay()
        globalMutate('/api/posts?range=3month&filter=both&limit=30&skip=0', undefined, { revalidate: true })
        globalMutate('/api/posts?range=3month&filter=me&limit=30&skip=0', undefined, { revalidate: true })
        globalMutate('/api/posts?range=3month&filter=partner&limit=30&skip=0', undefined, { revalidate: true })
        globalMutate('/api/posts?range=3month&limit=30&skip=0', undefined, { revalidate: true })
      } else {
        toast.error(data.error || 'Lỗi khi đăng bài')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSavingPost(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <HeartLoader />
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            {formatDateForDisplay(date)}
          </h1>
          <Link
            href="/review"
            className="flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl"
          >
            <ArrowLeft size={16} /> Quay lại
          </Link>
        </div>

        {/* Quote */}
        {dayData?.quote && (
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <Sparkles size={20} /> Câu nói hôm nay
            </h2>
            <p className="text-lg text-foreground/80 italic border-l-4 border-primary/50 pl-4 py-2">
              &quot;{dayData.quote.text}&quot;
            </p>
          </div>
        )}

        {/* Cập nhật cho ngày này: mood + bài đăng */}
        <div className="glass-card p-6 md:p-8 border-2 border-primary/20">
          <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-2">
            <Heart className="text-primary fill-primary" size={24} /> 
            Cập nhật ngày {formatDateForDisplay(date)}
          </h2>
          <p className="text-foreground/70 mb-6">
            Bạn có thể thêm hoặc sửa cảm xúc và đăng bài cho ngày này (bù ngày đã quên).
          </p>

          {/* Form mood */}
          <div className="mb-8 p-5 bg-secondary/30 rounded-2xl border border-border">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Smile size={18} /> Cảm xúc của bạn
            </h3>
            <form onSubmit={handleSubmitMood} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">Cảm xúc</label>
                  <select
                    value={moodType}
                    onChange={(e) => setMoodType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    {MOOD_TYPES.map((m) => (
                      <option key={m} value={m}>
                        {moodEmojis[m]} {moodLabels[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">Cường độ (1–3)</label>
                  <select
                    value={moodIntensity}
                    onChange={(e) => setMoodIntensity(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        Mức độ {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Ví dụ: Đi chơi với người ấy..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={savingMood}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingMood ? 'Đang lưu...' : dayData?.moods?.me ? 'Cập nhật cảm xúc' : 'Lưu cảm xúc'}
              </button>
            </form>
          </div>

          {/* Form bài đăng */}
          <div className="p-5 bg-secondary/30 rounded-2xl border border-border">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <MessageSquare size={18} /> Ghi lại khoảnh khắc
            </h3>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onPaste={handlePasteImages}
                placeholder="Hôm đó đã có chuyện gì vui..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] resize-none"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-sm text-foreground font-medium transition-colors">
                    <ImageIcon size={18} /> Chọn ảnh
                  </span>
                </label>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-sm text-foreground font-medium transition-colors disabled:opacity-50"
                >
                  <Camera size={18} /> Chụp ảnh
                </button>
                {uploading && <span className="text-sm text-foreground/50 animate-pulse">Đang tải ảnh...</span>}
              </div>
              {postImages.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {postImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center">
                        {img.url.startsWith('data:') ? (
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Image src={img.url} alt="" width={96} height={96} className="w-full h-full object-cover" unoptimized={!img.url.includes('cloudinary')} />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPostImages((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPost || uploading || !postContent.trim()}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {savingPost ? 'Đang đăng...' : 'Đăng bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mood Events Timeline */}
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <Smile className="text-primary" size={24} /> Cảm xúc trong ngày
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* My Mood Events */}
            <div>
              <h3 className="font-bold text-foreground/80 mb-4 pb-2 border-b border-border">Của bạn</h3>
              {dayData?.moodEvents?.me && dayData.moodEvents.me.length > 0 ? (
                <div className="space-y-4">
                  {dayData.moodEvents.me.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-3 p-4 bg-secondary/30 border border-border rounded-xl">
                      <span className="text-3xl">{moodEmojis[event.mood]}</span>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span className="font-bold text-foreground">{moodLabels[event.mood]}</span>
                          <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">Mức {event.intensity}</span>
                          <span className="text-xs text-foreground/50 ml-auto">{formatTime(event.createdAt)}</span>
                        </div>
                        {event.note && (
                          <p className="text-sm text-foreground/80 italic">&quot;{event.note}&quot;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/50 text-sm italic py-2">Bạn chưa ghi lại cảm xúc nào.</p>
              )}
            </div>

            {/* Partner Mood Events */}
            <div>
              <h3 className="font-bold text-foreground/80 mb-4 pb-2 border-b border-border">Của người ấy</h3>
              {dayData?.moodEvents?.partner && dayData.moodEvents.partner.length > 0 ? (
                <div className="space-y-4">
                  {dayData.moodEvents.partner.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-3 p-4 bg-secondary/30 border border-border rounded-xl">
                      <span className="text-3xl">{moodEmojis[event.mood]}</span>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span className="font-bold text-foreground">{moodLabels[event.mood]}</span>
                          <span className="text-xs font-semibold text-accent/80 bg-accent/10 px-2 py-0.5 rounded-md">Mức {event.intensity}</span>
                          <span className="text-xs text-foreground/50 ml-auto">{formatTime(event.createdAt)}</span>
                        </div>
                        {event.note && (
                          <p className="text-sm text-foreground/80 italic">&quot;{event.note}&quot;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/50 text-sm italic py-2">Người ấy chưa ghi lại cảm xúc nào.</p>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <MessageSquare className="text-primary" size={24} /> Bài đăng
          </h2>
          <div className="space-y-6">
            {dayData?.posts?.me && dayData.posts.me.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground/80 mb-4 pb-2 border-b border-border">Của bạn</h3>
                <div className="grid grid-cols-1 gap-4">
                  {dayData.posts.me.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block bg-secondary/20 border-l-4 border-primary p-5 rounded-2xl hover:bg-secondary/40 transition-colors border-y border-r"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {post.author?.image ? (
                          <Image src={post.author.image} alt={post.author.name || 'Bạn'} width={36} height={36} className="rounded-full shadow-md" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {post.author?.name?.charAt(0).toUpperCase() || 'B'}
                          </div>
                        )}
                        <span className="font-bold text-foreground">{post.author?.name || 'Bạn'}</span>
                        <span className="text-xs text-foreground/50 ml-auto">{formatTime(post.createdAt)}</span>
                      </div>
                      <p className="text-foreground/90 mb-3 whitespace-pre-wrap">
                        {post.content.substring(0, 200)}
                        {post.content.length > 200 ? '...' : ''}
                      </p>
                      {post.images?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                          {post.images.slice(0, 3).map((img: any, i: number) =>
                            img.url.startsWith('data:') ? (
                              <img key={i} src={img.url} alt="" className="w-full h-32 object-cover rounded-xl" />
                            ) : (
                              <div key={i} className="relative w-full h-32">
                                <Image src={img.url} alt="" fill className="object-cover rounded-xl" unoptimized={!img.url.includes('cloudinary')} />
                              </div>
                            )
                          )}
                          {post.images.length > 3 && (
                            <div className="w-full h-32 flex items-center justify-center bg-secondary rounded-xl text-foreground/70 font-bold">
                              +{post.images.length - 3} ảnh
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-sm text-primary font-bold mt-4 inline-block hover:underline">Xem chi tiết →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {dayData?.posts?.partner && dayData.posts.partner.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground/80 mb-4 pb-2 border-b border-border mt-8">
                  Của {dayData.posts.partner[0]?.author?.name || 'người ấy'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {dayData.posts.partner.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block bg-secondary/20 border-l-4 border-accent p-5 rounded-2xl hover:bg-secondary/40 transition-colors border-y border-r"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {post.author?.image ? (
                          <Image src={post.author.image} alt={post.author.name || 'Partner'} width={36} height={36} className="rounded-full shadow-md" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                            {post.author?.name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                        )}
                        <span className="font-bold text-foreground">{post.author?.name || 'Người ấy'}</span>
                        <span className="text-xs text-foreground/50 ml-auto">{formatTime(post.createdAt)}</span>
                      </div>
                      <p className="text-foreground/90 mb-3 whitespace-pre-wrap">
                        {post.content.substring(0, 200)}
                        {post.content.length > 200 ? '...' : ''}
                      </p>
                      {post.images?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                          {post.images.slice(0, 3).map((img: any, i: number) =>
                            img.url.startsWith('data:') ? (
                              <img key={i} src={img.url} alt="" className="w-full h-32 object-cover rounded-xl" />
                            ) : (
                              <div key={i} className="relative w-full h-32">
                                <Image src={img.url} alt="" fill className="object-cover rounded-xl" unoptimized={!img.url.includes('cloudinary')} />
                              </div>
                            )
                          )}
                          {post.images.length > 3 && (
                            <div className="w-full h-32 flex items-center justify-center bg-secondary rounded-xl text-foreground/70 font-bold">
                              +{post.images.length - 3} ảnh
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-sm text-accent font-bold mt-4 inline-block hover:underline">Xem chi tiết →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(!dayData?.posts?.me || dayData.posts.me.length === 0) &&
             (!dayData?.posts?.partner || dayData.posts.partner.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                <span className="text-4xl mb-3 block opacity-50">✍️</span>
                <p className="text-foreground/60 font-medium">Chưa có bài đăng nào trong ngày này</p>
              </div>
            )}
          </div>
        </div>

        {/* Starred Moments */}
        {dayData?.starred && dayData.starred.length > 0 && (
          <div className="glass-card p-6 md:p-8 border-l-4 border-yellow-500/80">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={24} /> Khoảnh khắc đáng nhớ
            </h2>
            <div className="space-y-4">
              {dayData.starred.map((post: any) => (
                <div key={post.id} className="bg-secondary/30 p-5 rounded-2xl border border-border">
                  <p className="text-foreground/90 mb-3">{post.content}</p>
                  {post.images?.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {post.images.map((img: any, i: number) => (
                        img.url.startsWith('data:') ? (
                          <img key={i} src={img.url} alt="" className="w-full h-32 object-cover rounded-xl" />
                        ) : (
                          <div key={i} className="relative w-full h-32">
                            <Image src={img.url} alt="" fill className="object-cover rounded-xl" unoptimized={!img.url.includes('cloudinary')} />
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
