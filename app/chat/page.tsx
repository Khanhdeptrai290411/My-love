'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PendingImage {
  id: string
  file: File
  preview: string
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleAddImage = (file: File) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const preview = URL.createObjectURL(file)
    setPendingImages([...pendingImages, { id, file, preview }])
  }

  const handleRemoveImage = (id: string) => {
    const image = pendingImages.find(img => img.id === id)
    if (image) {
      URL.revokeObjectURL(image.preview)
    }
    setPendingImages(pendingImages.filter(img => img.id !== id))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && pendingImages.length === 0) return

    setSending(true)
    try {
      // Upload all pending images first (song song để tăng tốc độ)
      const imageUrls: string[] = []
      
      const uploadPromises = pendingImages.map(async (pendingImage) => {
        setUploadingImages(prev => ({ ...prev, [pendingImage.id]: true }))
        try {
          // Compress ảnh trước khi upload
          const { compressImage } = await import('@/lib/utils')
          const compressedFile = await compressImage(pendingImage.file, 1920, 1920, 0.85)

          const formData = new FormData()
          formData.append('file', compressedFile)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          if (uploadRes.ok) {
            imageUrls.push(uploadData.url)
          } else {
            toast.error(uploadData.error || 'Upload ảnh thất bại')
          }
        } catch (error) {
          toast.error('Có lỗi xảy ra khi upload ảnh')
        } finally {
          setUploadingImages(prev => {
            const newState = { ...prev }
            delete newState[pendingImage.id]
            return newState
          })
        }
      })
      
      await Promise.all(uploadPromises)

      // Send message(s) - one message per image, or one message with text if no images
      if (imageUrls.length > 0) {
        // Send each image as a separate message (or combine with text if only one image)
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i]
          const isLastImage = i === imageUrls.length - 1
          const textToSend = isLastImage ? message.trim() : '' // Only add text to last image
          
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: textToSend, 
              imageUrl 
            }),
          })
          
          if (!res.ok) {
            const data = await res.json()
            toast.error(data.error || 'Gửi tin nhắn thất bại')
          }
        }
      } else if (message.trim()) {
        // Send text-only message
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message.trim() }),
        })
        
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Gửi tin nhắn thất bại')
        }
      }

      // Clear form
      setMessage('')
      pendingImages.forEach(img => URL.revokeObjectURL(img.preview))
      setPendingImages([])
      mutate()
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
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4 pb-28">
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
                          className="rounded mb-2 max-w-full h-auto"
                        />
                      )}
                      {msg.text && <p>{msg.text}</p>}
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

      </div>

      {/* Form cố định dưới màn hình để luôn thấy trên mobile */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-3 sm:px-4 py-2"
        onPaste={(e) => {
          const items = Array.from(e.clipboardData.items)
          items.forEach((item) => {
            if (item.type.startsWith('image/')) {
              e.preventDefault()
              const file = item.getAsFile()
              if (file) {
                handleAddImage(file)
              }
            }
          })
        }}
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* Image Preview */}
          {pendingImages.length > 0 && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-2 flex-wrap">
                {pendingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                    {uploadingImages[img.id] && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                        <div className="text-white text-xs">Đang tải...</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn... (có thể dán ảnh Ctrl+V)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white text-sm"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                files.forEach(file => handleAddImage(file))
                e.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
              title="Chọn ảnh"
            >
              📷
            </button>

            <button
              type="submit"
              disabled={sending || (!message.trim() && pendingImages.length === 0)}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50 text-sm"
            >
              {sending ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

