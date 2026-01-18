'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: messagesData, mutate } = useSWR('/api/messages', fetcher, {
    refreshInterval: 3000, // Refresh every 3 seconds
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('')
        mutate()
      } else {
        toast.error(data.error || 'Gửi tin nhắn thất bại')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSending(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Đang tải...</div>
      </div>
    )
  }

  const messages = messagesData?.messages || []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Chat</h1>

        <div className="flex-1 bg-white rounded-lg shadow-md p-4 mb-4 overflow-y-auto">
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg: any) => {
                const isMe = msg.sender?.email === session?.user?.email
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isMe
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {!isMe && (
                        <div className="text-xs font-semibold mb-1">
                          {msg.sender.name}
                        </div>
                      )}
                      {msg.imageUrl && (
                        <Image
                          src={msg.imageUrl}
                          alt="Chat image"
                          width={200}
                          height={200}
                          className="rounded mb-2"
                        />
                      )}
                      <p>{msg.text}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Chưa có tin nhắn nào. Bắt đầu trò chuyện!
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  )
}

