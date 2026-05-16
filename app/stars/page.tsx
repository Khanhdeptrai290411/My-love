'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import HeartLoader from '@/components/HeartLoader'
import { formatDateForDisplay } from '@/components/DateInput'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StarsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: postsData, isLoading } = useSWR('/api/posts?range=3month&limit=200', fetcher)

  const starredPosts = postsData?.posts?.filter((p: any) => p.starred) || []

  if (status === 'loading' || isLoading) {
    return <HeartLoader />
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <h1 className="text-4xl font-bold mb-8 text-foreground flex items-center gap-3">
          <span className="text-yellow-500 drop-shadow-sm">⭐</span>
          Khoảnh khắc đáng nhớ
        </h1>

        {starredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {starredPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="glass-card hover:-translate-y-1 p-6 border border-border transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground/50 bg-background px-3 py-1 rounded-full">{formatDateForDisplay(post.date)}</span>
                  <span className="text-yellow-500 text-lg group-hover:scale-125 transition-transform duration-300 drop-shadow-sm">⭐</span>
                </div>
                <p className="text-foreground/90 font-medium mb-4 leading-relaxed line-clamp-3">{post.content}</p>
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
          <div className="glass-card border border-border p-12 text-center mt-10">
            <span className="text-6xl drop-shadow-sm mb-4 block opacity-50 grayscale">⭐</span>
            <p className="text-foreground/60 text-lg font-medium mb-2">Chưa có khoảnh khắc nào được đánh dấu sao</p>
            <p className="text-foreground/40 text-sm mb-6">Hãy lướt lại kỷ niệm và thả sao những khoảnh khắc tuyệt vời nhất nhé!</p>
            <Link
              href="/home"
              className="mt-4 px-6 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold rounded-xl transition inline-block"
            >
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

