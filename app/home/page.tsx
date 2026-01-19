'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { getTodayDate } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import LoveCounter from '@/components/LoveCounter'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [postContent, setPostContent] = useState('')
  const [postImages, setPostImages] = useState<{ url: string; publicId: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const [postFilter, setPostFilter] = useState<'me' | 'partner' | 'both'>('both')
  
  const { data: couple, isLoading: coupleLoading } = useSWR('/api/couple/me', fetcher)
  const { data: quote, isLoading: quoteLoading } = useSWR('/api/quote/today', fetcher)
  const { data: postsData, isLoading: postsLoading, mutate: mutatePosts } = useSWR(`/api/posts?range=month&filter=${postFilter}`, fetcher)
  const { data: moodMatchData } = useSWR('/api/mood-match/today', fetcher, {
    refreshInterval: 60000,
  })

  // Removed todayPost check - allow multiple posts per day

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setPostImages([...postImages, { url: data.url, publicId: data.publicId }])
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  if (!couple?.couple) {
    router.push('/couple')
    return null
  }

  const hasPartner = couple.couple.members?.length >= 2

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Trang chủ</h1>

        {/* Love Counter */}
        {couple?.couple?.startDate && hasPartner ? (
          <div className="bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500 rounded-2xl shadow-xl mb-6 overflow-hidden relative">
            {/* Background blur effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-sm"></div>
            <LoveCounter
              startDate={couple.couple.startDate}
              member1Name={couple.couple.members?.[0]?.name}
              member2Name={couple.couple.members?.[1]?.name}
              member1Image={couple.couple.members?.[0]?.image}
              member2Image={couple.couple.members?.[1]?.image}
            />
          </div>
        ) : !hasPartner ? (
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl shadow-xl mb-6 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Bạn chưa thiết lập mối quan hệ</h2>
              <p className="text-gray-600 mb-6">
                Vui lòng sao chép mã sau để gửi cho người yêu của bạn:
              </p>
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-pink-300">
                <p className="text-3xl font-bold text-pink-600 mb-2">{couple.couple.inviteCode}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(couple.couple.inviteCode)
                    toast.success('Đã sao chép mã!')
                  }}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium"
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

        {/* Quote of the Day */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Câu nói hôm nay</h2>
          {quoteLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <p className="text-lg text-gray-600 italic">
              &quot;{quote?.text || 'Hôm nay em có muốn nói gì với anh không?'}&quot;
            </p>
          )}
        </div>

        {/* Write Post Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Đăng bài</h2>
          
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent min-h-[120px] text-gray-900 placeholder-gray-400 bg-white resize-none"
              placeholder="Viết về ngày của bạn..."
            />

            {/* Image Upload Section */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
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

        {/* Mood Match Card */}
        {moodMatchData && (
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Mood match hôm nay</h2>
            <p className="text-gray-700 mb-4">{moodMatchData.message}</p>
            <Link
              href="/mood"
              className="inline-block bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
            >
              Check-in mood
            </Link>
          </div>
        )}

        {/* Fix Index Button (temporary) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-2">
            ⚠️ Nếu bạn gặp lỗi &quot;duplicate key error&quot;, hãy click nút bên dưới để sửa:
          </p>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/drop-index', { method: 'POST' })
                const data = await res.json()
                if (res.ok) {
                  toast.success(data.message || 'Đã sửa lỗi! Bây giờ bạn có thể đăng nhiều post trong 1 ngày.')
                } else {
                  toast.error(data.error || 'Lỗi khi sửa')
                }
              } catch (error) {
                toast.error('Có lỗi xảy ra')
              }
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm font-semibold"
          >
            🔧 Sửa lỗi duplicate key
          </button>
        </div>

        {/* All Posts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Tất cả bài đăng</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPostFilter('both')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  postFilter === 'both'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cả hai
              </button>
              <button
                onClick={() => setPostFilter('me')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  postFilter === 'me'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Của tôi
              </button>
              <button
                onClick={() => setPostFilter('partner')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  postFilter === 'partner'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Của người ấy
              </button>
            </div>
          </div>
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : postsData?.posts?.length > 0 ? (
            <div className="space-y-4">
              {postsData.posts.map((post: any) => (
                <PostCard key={post.id} post={post} onUpdate={mutatePosts} />
              ))}
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
