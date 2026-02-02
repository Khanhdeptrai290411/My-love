'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
      // Compress ảnh trước khi upload để giảm kích thước và tăng tốc độ
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
    // Upload song song để tăng tốc độ
    const uploadPromises = files.map((file) => uploadImageFile(file))
    await Promise.all(uploadPromises)
    e.target.value = ''
  }

  const handlePasteImages = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items).filter((item) => item.type.startsWith('image/'))
    if (!items.length) return
    e.preventDefault()
    // Upload song song các ảnh đã paste
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{date}</h1>
          <Link
            href="/review"
            className="text-pink-500 hover:text-pink-600"
          >
            ← Quay lại Review
          </Link>
        </div>

        {/* Quote */}
        {dayData?.quote && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Câu nói hôm nay</h2>
            <p className="text-lg text-gray-600 italic">
              &quot;{dayData.quote.text}&quot;
            </p>
          </div>
        )}

        {/* Cập nhật cho ngày này: mood + bài đăng */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Cập nhật cho ngày {date}</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có thể thêm hoặc sửa mood và đăng bài cho ngày này (bù ngày đã quên).
          </p>

          {/* Form mood */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Mood của bạn</h3>
            <form onSubmit={handleSubmitMood} className="space-y-3">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cảm xúc</label>
                  <select
                    value={moodType}
                    onChange={(e) => setMoodType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  >
                    {MOOD_TYPES.map((m) => (
                      <option key={m} value={m}>
                        {moodEmojis[m]} {moodLabels[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cường độ (1–3)</label>
                  <select
                    value={moodIntensity}
                    onChange={(e) => setMoodIntensity(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Ví dụ: Đi chơi với bạn..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={savingMood}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
              >
                {savingMood ? 'Đang lưu...' : dayData?.moods?.me ? 'Cập nhật mood' : 'Thêm mood cho ngày này'}
              </button>
            </form>
          </div>

          {/* Form bài đăng */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Thêm bài đăng cho ngày này</h3>
            <form onSubmit={handleSubmitPost} className="space-y-3">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onPaste={handlePasteImages}
                placeholder="Viết về ngày đó..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 min-h-[100px] text-gray-900 placeholder-gray-400 bg-white resize-none"
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
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                    📷 Album
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
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium disabled:opacity-50"
                >
                  📸 Chụp ảnh
                </button>
                {uploading && <span className="text-sm text-gray-500">Đang tải ảnh...</span>}
              </div>
              {postImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {postImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {img.url.startsWith('data:') ? (
                          <img src={img.url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Image src={img.url} alt="" width={80} height={80} className="w-full h-full object-contain" unoptimized={!img.url.includes('cloudinary')} />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPostImages((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={savingPost || uploading || !postContent.trim()}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
              >
                {savingPost ? 'Đang đăng...' : 'Đăng bài cho ngày này'}
              </button>
            </form>
          </div>
        </div>

        {/* Mood Events Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Mood trong ngày</h2>
          
          {/* My Mood Events */}
          {dayData?.moodEvents?.me && dayData.moodEvents.me.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-600 mb-3">Của mình</h3>
              <div className="space-y-3">
                {dayData.moodEvents.me.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{moodEmojis[event.mood]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{moodLabels[event.mood]}</span>
                        <span className="text-sm text-gray-500">(Cường độ: {event.intensity})</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatTime(event.createdAt)}</span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partner Mood Events */}
          {dayData?.moodEvents?.partner && dayData.moodEvents.partner.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-600 mb-3">Của người ấy</h3>
              <div className="space-y-3">
                {dayData.moodEvents.partner.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{moodEmojis[event.mood]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{moodLabels[event.mood]}</span>
                        <span className="text-sm text-gray-500">(Cường độ: {event.intensity})</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatTime(event.createdAt)}</span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No mood events */}
          {(!dayData?.moodEvents?.me || dayData.moodEvents.me.length === 0) &&
           (!dayData?.moodEvents?.partner || dayData.moodEvents.partner.length === 0) && (
            <p className="text-gray-500 text-center py-4">Chưa có mood nào trong ngày này</p>
          )}
        </div>

        {/* Posts */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Bài đăng</h2>
          <div className="space-y-6">
            {dayData?.posts?.me && dayData.posts.me.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-pink-500">👤</span>
                  Của mình
                </h3>
                <div className="space-y-4">
                  {dayData.posts.me.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block bg-pink-50 border-l-4 border-pink-500 p-4 rounded-lg hover:bg-pink-100 transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {post.author?.image ? (
                          <Image
                            src={post.author.image}
                            alt={post.author.name || 'Bạn'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold text-sm">
                            {post.author?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || 'B'}
                          </div>
                        )}
                        <span className="font-semibold text-gray-800">{post.author?.name || session?.user?.name || 'Bạn'}</span>
                      </div>
                      <p className="text-gray-800 mb-2">
                        {post.content.substring(0, 200)}
                        {post.content.length > 200 ? '...' : ''}
                      </p>
                      {post.images?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {post.images.slice(0, 2).map((img: any, i: number) =>
                            img.url.startsWith('data:') ? (
                              <img
                                key={i}
                                src={img.url}
                                alt={`Image ${i + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                            ) : (
                              <Image
                                key={i}
                                src={img.url}
                                alt={`Image ${i + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-32 object-cover rounded"
                                unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                              />
                            )
                          )}
                        </div>
                      )}
                      <p className="text-sm text-pink-500 mt-2">Xem chi tiết →</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {dayData?.posts?.partner && dayData.posts.partner.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-blue-500">💙</span>
                  Của {dayData.posts.partner[0]?.author?.name || 'người ấy'}
                </h3>
                <div className="space-y-4">
                  {dayData.posts.partner.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg hover:bg-blue-100 transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {post.author?.image ? (
                          <Image
                            src={post.author.image}
                            alt={post.author.name || 'Người ấy'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {post.author?.name?.charAt(0).toUpperCase() || 'N'}
                          </div>
                        )}
                        <span className="font-semibold text-gray-800">{post.author?.name || 'Người ấy'}</span>
                      </div>
                      <p className="text-gray-800 mb-2">
                        {post.content.substring(0, 200)}
                        {post.content.length > 200 ? '...' : ''}
                      </p>
                      {post.images?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {post.images.slice(0, 2).map((img: any, i: number) =>
                            img.url.startsWith('data:') ? (
                              <img
                                key={i}
                                src={img.url}
                                alt={`Image ${i + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                            ) : (
                              <Image
                                key={i}
                                src={img.url}
                                alt={`Image ${i + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-32 object-cover rounded"
                                unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                              />
                            )
                          )}
                        </div>
                      )}
                      <p className="text-sm text-blue-500 mt-2">Xem chi tiết →</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(!dayData?.posts?.me || dayData.posts.me.length === 0) &&
             (!dayData?.posts?.partner || dayData.posts.partner.length === 0) && (
              <p className="text-gray-500">Chưa có bài đăng nào</p>
            )}
          </div>
        </div>

        {/* Starred Moments */}
        {dayData?.starred && dayData.starred.length > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              <span className="text-yellow-500 mr-2">⭐</span>
              Khoảnh khắc đáng nhớ
            </h2>
            <div className="space-y-4">
              {dayData.starred.map((post: any) => (
                <div key={post.id} className="bg-white p-4 rounded-lg">
                  <p className="text-gray-800">{post.content}</p>
                  {post.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {post.images.map((img: any, i: number) => (
                        img.url.startsWith('data:') ? (
                          <img
                            key={i}
                            src={img.url}
                            alt={`Starred ${i + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <Image
                            key={i}
                            src={img.url}
                            alt={`Starred ${i + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded"
                            unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                          />
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
