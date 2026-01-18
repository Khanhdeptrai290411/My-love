'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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

  const { data: dayData, isLoading } = useSWR(`/api/day?date=${date}`, fetcher)

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
            <p className="text-lg text-gray-600 italic">"{dayData.quote.text}"</p>
          </div>
        )}

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
            {dayData?.posts?.me && (
              <div>
                <h3 className="font-medium text-gray-600 mb-2">Của mình</h3>
                <Link
                  href={`/post/${dayData.posts.me.id}`}
                  className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition"
                >
                  <p className="text-gray-800 mb-2">{dayData.posts.me.content.substring(0, 200)}{dayData.posts.me.content.length > 200 ? '...' : ''}</p>
                  {dayData.posts.me.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dayData.posts.me.images.slice(0, 2).map((img: any, i: number) => (
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
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-pink-500 mt-2">Xem chi tiết →</p>
                </Link>
              </div>
            )}
            {dayData?.posts?.partner && (
              <div>
                <h3 className="font-medium text-gray-600 mb-2">
                  Của {dayData.posts.partner.author?.name || 'người ấy'}
                </h3>
                <Link
                  href={`/post/${dayData.posts.partner.id}`}
                  className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition"
                >
                  <p className="text-gray-800 mb-2">{dayData.posts.partner.content.substring(0, 200)}{dayData.posts.partner.content.length > 200 ? '...' : ''}</p>
                  {dayData.posts.partner.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dayData.posts.partner.images.slice(0, 2).map((img: any, i: number) => (
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
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-pink-500 mt-2">Xem chi tiết →</p>
                </Link>
              </div>
            )}
            {!dayData?.posts?.me && !dayData?.posts?.partner && (
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
