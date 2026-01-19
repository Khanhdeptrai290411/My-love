'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, gender: gender || undefined }),
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập')
        router.push('/auth/login')
      } else {
        toast.error(data.error || 'Đăng ký thất bại')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Đăng ký</h1>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Nhập tên của bạn"
              required
            />
          </div>
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
              Giới tính (có thể cập nhật sau)
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
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
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Nhập lại mật khẩu"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="text-pink-500 hover:text-pink-600 font-semibold">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

