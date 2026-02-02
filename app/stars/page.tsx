'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StarsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: postsData, isLoading } = useSWR('/api/posts?range=3month', fetcher)

  const starredPosts = postsData?.posts?.filter((p: any) => p.starred) || []

  if (status === 'loading' || isLoading) {
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
          <span className="text-yellow-500 mr-2">⭐</span>
          Khoảnh khắc đáng nhớ
        </h1>

        {starredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {starredPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{post.date}</span>
                  <span className="text-yellow-500">⭐</span>
                </div>
                <p className="text-gray-800 mb-3">{post.content.substring(0, 150)}...</p>
                {post.images?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.slice(0, 2).map((img: any, i: number) => (
                      img.url.startsWith('data:') ? (
                        <img
                          key={i}
                          src={img.url}
                          alt={`Starred ${i + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <Image
                          key={i}
                          src={img.url}
                          alt={`Starred ${i + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-24 object-cover rounded"
                          unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                        />
                      )
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Chưa có khoảnh khắc nào được đánh dấu sao</p>
            <Link
              href="/home"
              className="mt-4 inline-block text-pink-500 hover:text-pink-600"
            >
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

