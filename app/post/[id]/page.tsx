'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = params
  const [starring, setStarring] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: postData, isLoading, mutate } = useSWR(`/api/posts/${id}`, fetcher)

  const handleStar = async () => {
    if (!postData?.post) return

    setStarring(true)
    try {
      const res = await fetch(`/api/posts/${id}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !postData.post.starred }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(data.post.starred ? 'Đã đánh dấu sao' : 'Đã bỏ đánh dấu sao')
        mutate()
      } else {
        toast.error(data.error || 'Lỗi khi đánh dấu sao')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setStarring(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  if (!postData?.post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Không tìm thấy bài đăng</p>
            <Link
              href="/home"
              className="text-pink-500 hover:text-pink-600 font-semibold"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const post = postData.post
  const isMyPost = post.author?.email === session?.user?.email

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/home"
            className="text-pink-500 hover:text-pink-600 font-semibold"
          >
            ← Quay lại
          </Link>
          <button
            onClick={handleStar}
            disabled={starring}
            className={`px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
              post.starred
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {starring ? '...' : post.starred ? '⭐ Đã đánh dấu sao' : '☆ Đánh dấu sao'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {post.author?.image && (
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900">{post.author?.name || 'Người dùng'}</p>
                <p className="text-sm text-gray-500">{post.date}</p>
              </div>
            </div>
            {post.starred && (
              <span className="text-yellow-500 text-2xl">⭐</span>
            )}
          </div>

          <div className="mb-4">
            <p className="text-gray-800 text-lg whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {post.images.map((img: any, index: number) => (
                <div key={index} className="relative group">
                  {img.url.startsWith('data:') ? (
                    <img
                      src={img.url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-auto rounded-lg object-cover"
                    />
                  ) : (
                    <Image
                      src={img.url}
                      alt={`Post image ${index + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-auto rounded-lg object-cover"
                      unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Đăng vào {new Date(post.createdAt).toLocaleString('vi-VN')}
              </span>
              {isMyPost && (
                <Link
                  href={`/home`}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition font-semibold text-sm"
                >
                  ✏️ Sửa bài đăng
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Link
            href={`/day/${post.date}`}
            className="text-pink-500 hover:text-pink-600 font-semibold"
          >
            ← Xem tất cả bài đăng trong ngày {post.date}
          </Link>
        </div>
      </div>
    </div>
  )
}

