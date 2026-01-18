import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">My Love</h1>
        <p className="text-xl text-gray-600 mb-8">
          App dành cho cặp đôi - viết blog, check-in mood, và lưu giữ khoảnh khắc
        </p>
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
