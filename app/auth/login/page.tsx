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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      
      <div className="glass-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border/50 relative z-10 backdrop-blur-xl">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-sm">Đăng nhập</h1>
        
        {hasGoogleAuth && (
          <>
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition mb-4"
            >
              Đăng nhập với Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 glass text-foreground/50 font-medium rounded-full text-xs uppercase tracking-wider">Hoặc</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleCredentialsSignIn} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-foreground/80 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/40 bg-background/50 shadow-inner transition"
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground/80 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/40 bg-background/50 shadow-inner transition"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-foreground/70 font-medium">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-primary hover:opacity-80 font-bold underline decoration-primary/30 underline-offset-4">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

