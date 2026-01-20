'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CouplePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [action, setAction] = useState<'create' | 'join' | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: coupleData, mutate } = useSWR('/api/couple/me', fetcher)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Không auto-redirect về /home nữa để người dùng có thể quản lý / reset couple tại đây

  const handleLeaveCouple = async () => {
    if (!confirm('Bạn chắc chắn muốn rời khỏi couple hiện tại? Bạn có thể nhập lại mã mời sau.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/couple/leave', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Bạn đã rời khỏi couple. Giờ có thể tạo hoặc nhập lại mã mời.')
        mutate()
      } else {
        toast.error(data.error || 'Không thể rời couple')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate) {
      toast.error('Vui lòng nhập ngày hẹn hò')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/couple/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Đã tạo couple! Mã mời: ${data.couple.inviteCode}`)
        mutate()
      } else {
        toast.error(data.error || 'Lỗi khi tạo couple')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Đã join couple thành công!')
        mutate()
      } else {
        toast.error(data.error || 'Mã mời không hợp lệ')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {coupleData?.couple ? 'Thông tin couple' : 'Tạo hoặc tham gia couple'}
        </h1>

        {coupleData?.couple ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Couple hiện tại</h2>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Mã mời:</span>{' '}
                <span className="font-mono text-lg">{coupleData.couple.inviteCode}</span>
              </p>
              {coupleData.couple.startDate && (
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Ngày hẹn hò:</span>{' '}
                  {coupleData.couple.startDate}
                </p>
              )}
              <div className="mt-4">
                <p className="font-semibold text-gray-800 mb-2">Thành viên:</p>
                <ul className="list-disc list-inside text-gray-700">
                  {coupleData.couple.members?.map((m: any) => (
                    <li key={m.id}>
                      {m.name} ({m.email})
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleLeaveCouple}
                className="mt-6 w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Rời khỏi couple / reset để nhập lại mã'}
              </button>
            </div>
          </div>
        ) : !action ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setAction('create')}
              className="bg-pink-500 text-white py-12 rounded-lg shadow-lg hover:bg-pink-600 transition text-xl font-semibold"
            >
              Tạo couple mới
            </button>
            <button
              onClick={() => setAction('join')}
              className="bg-purple-500 text-white py-12 rounded-lg shadow-lg hover:bg-purple-600 transition text-xl font-semibold"
            >
              Tham gia couple
            </button>
          </div>
        ) : action === 'create' ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tạo couple mới</h2>
            <p className="text-gray-600 mb-6">
              Nhập ngày hẹn hò của hai bạn. Mã mời sẽ được tạo từ ngày này.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày hẹn hò
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ví dụ: 03/12/2020
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo couple'}
              </button>
              <button
                type="button"
                onClick={() => setAction(null)}
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Quay lại
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tham gia couple</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã mời
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="Nhập mã mời"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50"
              >
                {loading ? 'Đang tham gia...' : 'Tham gia'}
              </button>
              <button
                type="button"
                onClick={() => setAction(null)}
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Quay lại
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

