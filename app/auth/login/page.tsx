'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false)

  // Check if Google auth is available
  useEffect(() => {
    // Check if Google credentials exist (client-side check)
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => {
        setHasGoogleAuth(!!data.google)
      })
      .catch(() => setHasGoogleAuth(false))
  }, [])

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/home' })
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.ok) {
        router.push('/home')
      } else {
        alert(result?.error || 'Đăng nhập thất bại')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      alert(error?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Đăng nhập</h1>
        
        {hasGoogleAuth && (
          <>
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition mb-4"
            >
              Đăng nhập với Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-pink-500 hover:text-pink-600 font-semibold">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

