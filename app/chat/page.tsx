'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import toast from 'react-hot-toast'
import HeartLoader from '@/components/HeartLoader'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PendingImage {
  id: string
  file: File
  preview: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatMessageTime(msgDate: Date, now = new Date()) {
  if (isSameDay(msgDate, now)) {
    return msgDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }
  return msgDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + msgDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDateDivider(date: Date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (msgDay.getTime() === today.getTime()) return 'Hôm nay'
  if (msgDay.getTime() === yesterday.getTime()) return 'Hôm qua'
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: messagesData, mutate } = useSWR('/api/messages', fetcher, {
    refreshInterval: 3000,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const handleAddImage = (file: File) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const preview = URL.createObjectURL(file)
    setPendingImages(prev => [...prev, { id, file, preview }])
  }

  const handleRemoveImage = (id: string) => {
    const image = pendingImages.find(img => img.id === id)
    if (image) URL.revokeObjectURL(image.preview)
    setPendingImages(pendingImages.filter(img => img.id !== id))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && pendingImages.length === 0) return

    setSending(true)
    try {
      const imageUrls: string[] = []
      const uploadPromises = pendingImages.map(async (pendingImage) => {
        setUploadingImages(prev => ({ ...prev, [pendingImage.id]: true }))
        try {
          const { compressImage } = await import('@/lib/utils')
          const compressedFile = await compressImage(pendingImage.file, 2560, 2560, 0.92)
          const formData = new FormData()
          formData.append('file', compressedFile)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          if (uploadRes.ok) {
            imageUrls.push(uploadData.url)
          } else {
            toast.error(uploadData.error || 'Upload ảnh thất bại')
          }
        } catch {
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

      if (imageUrls.length > 0) {
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i]
          const isLastImage = i === imageUrls.length - 1
          const textToSend = isLastImage ? message.trim() : ''
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSend, imageUrl }),
          })
          if (!res.ok) {
            const data = await res.json()
            toast.error(data.error || 'Gửi tin nhắn thất bại')
          }
        }
      } else if (message.trim()) {
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

      setMessage('')
      pendingImages.forEach(img => URL.revokeObjectURL(img.preview))
      setPendingImages([])
      mutate()
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as any)
    }
  }

  if (status === 'loading') return <HeartLoader />

  const messages = messagesData?.messages || []

  // Group messages: inject date dividers + bubble grouping
  const renderMessages = () => {
    const elements: React.ReactNode[] = []
    let prevDate: Date | null = null
    let prevSenderEmail: string | null = null

    messages.forEach((msg: any, idx: number) => {
      const isMe = msg.sender?.email === session?.user?.email
      const msgDate = new Date(msg.createdAt)
      const nextMsg = messages[idx + 1]
      const nextIsMe = nextMsg?.sender?.email === session?.user?.email
      const isLast = !nextMsg || nextIsMe !== isMe

      // Date divider
      if (!prevDate || !isSameDay(prevDate, msgDate)) {
        elements.push(
          <div key={`date-${msg.id}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-xs text-foreground/40 font-semibold px-2 py-0.5 bg-secondary/50 rounded-full whitespace-nowrap">
              {formatDateDivider(msgDate)}
            </span>
            <div className="flex-1 h-px bg-border/40" />
          </div>
        )
        prevDate = msgDate
      }

      const showAvatar = !isMe && isLast
      const isGroupStart = prevSenderEmail !== msg.sender?.email
      prevSenderEmail = msg.sender?.email

      elements.push(
        <div
          key={msg.id}
          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-3' : 'mt-0.5'}`}
        >
          {/* Partner avatar (left side) */}
          {!isMe && (
            <div className="w-8 flex-shrink-0">
              {showAvatar && msg.sender?.image ? (
                <img src={msg.sender.image} alt={msg.sender.name} className="w-8 h-8 rounded-full object-cover" />
              ) : showAvatar ? (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {msg.sender?.name?.[0]?.toUpperCase() || '?'}
                </div>
              ) : (
                <div className="w-8 h-8" />
              )}
            </div>
          )}

          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] lg:max-w-[60%]`}>
            {/* Sender name (first message in group, partner only) */}
            {!isMe && isGroupStart && (
              <span className="text-xs text-foreground/50 font-semibold mb-1 ml-3">
                {msg.sender?.name}
              </span>
            )}

            {/* Bubble */}
            <div
              title={formatMessageTime(msgDate)}
              onClick={() => setSelectedMsg(prev => prev === msg.id ? null : msg.id)}
              className={
                isMe
                  ? isGroupStart
                    ? 'relative px-4 py-2.5 shadow-sm bg-primary text-primary-foreground rounded-2xl rounded-br-md cursor-pointer'
                    : 'relative px-4 py-2.5 shadow-sm bg-primary text-primary-foreground rounded-2xl rounded-r-md cursor-pointer'
                  : isGroupStart
                    ? 'relative px-4 py-2.5 shadow-sm bg-secondary/80 dark:bg-white/10 text-foreground rounded-2xl rounded-bl-md border border-black/5 dark:border-white/5 backdrop-blur-md cursor-pointer'
                    : 'relative px-4 py-2.5 shadow-sm bg-secondary/80 dark:bg-white/10 text-foreground rounded-2xl rounded-l-md border border-black/5 dark:border-white/5 backdrop-blur-md cursor-pointer'
              }
            >
              {msg.imageUrl && (
                <div className="mb-1.5">
                  <Image
                    src={msg.imageUrl}
                    alt="Chat image"
                    width={240}
                    height={240}
                    className="rounded-xl max-w-full h-auto cursor-pointer"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              )}
              {msg.text && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
            </div>

            {/* Timestamp — last in group always shows, others on click/tap */}
            {(isLast || selectedMsg === msg.id) && (
              <span
                className={`text-[10px] text-foreground/40 mt-1 ${isMe ? 'mr-1' : 'ml-1'} animate-in fade-in duration-150`}
              >
                {formatMessageTime(msgDate)}
              </span>
            )}
          </div>

          {/* My avatar (right side - show only for last in group) */}
          {isMe && (
            <div className="w-8 flex-shrink-0">
              {isLast && session?.user?.image ? (
                <img src={session.user.image} alt="me" className="w-8 h-8 rounded-full object-cover" />
              ) : isLast ? (
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                  {session?.user?.name?.[0]?.toUpperCase() || 'M'}
                </div>
              ) : (
                <div className="w-8 h-8" />
              )}
            </div>
          )}
        </div>
      )
    })
    return elements
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center text-xl shadow">
            💬
          </div>
          <div>
            <h1 className="font-black text-lg text-foreground leading-none">Chat riêng</h1>
            <p className="text-xs text-foreground/50">Chỉ hai người biết thôi nhé 💕</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 pb-36">
          {messages.length > 0 ? (
            <>
              {renderMessages()}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="text-7xl animate-bounce">💌</div>
              <p className="text-foreground/50 font-semibold text-lg">Chưa có tin nhắn nào</p>
              <p className="text-foreground/30 text-sm">Bắt đầu trò chuyện với người ấy đi! 💕</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed input area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-xl shadow-2xl z-20">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3">
          {/* Image Preview */}
          {pendingImages.length > 0 && (
            <div className="mb-3 flex gap-2 flex-wrap p-2 bg-secondary/30 rounded-2xl border border-border">
              {pendingImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-border/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition shadow"
                  >
                    ×
                  </button>
                  {uploadingImages[img.id] && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="text-white text-xs font-bold">...</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="flex gap-2 items-end"
            onPaste={(e) => {
              const items = Array.from(e.clipboardData.items)
              items.forEach((item) => {
                if (item.type.startsWith('image/')) {
                  e.preventDefault()
                  const file = item.getAsFile()
                  if (file) handleAddImage(file)
                }
              })
            }}
          >
            {/* Image button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95"
              title="Chọn ảnh"
            >
              📷
            </button>

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

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhắn tin... (Enter gửi, Shift+Enter xuống dòng)"
                rows={1}
                className="w-full px-4 py-3 pr-4 border border-border bg-secondary/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-foreground placeholder-foreground/40 text-sm resize-none leading-relaxed transition-all max-h-32 overflow-y-auto"
                style={{ fieldSizing: 'content' } as any}
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={sending || (!message.trim() && pendingImages.length === 0)}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-primary/30"
              title="Gửi"
            >
              {sending ? (
                <span className="text-xs animate-spin">⏳</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -rotate-45 translate-x-0.5">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
