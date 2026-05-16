'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing, Smartphone, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission)
      
      const userAgent = window.navigator.userAgent.toLowerCase()
      setIsIOS(/iphone|ipad|ipod/.test(userAgent))
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone)

      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Trình duyệt của bạn không hỗ trợ thông báo đẩy (Push Notifications)')
      return
    }

    setLoading(true)
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        toast.error('Bạn đã từ chối cấp quyền thông báo.')
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('Missing VAPID public key')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }),
      })

      if (!response.ok) throw new Error('Failed to save subscription on server')

      setIsSubscribed(true)
      toast.success('Đăng ký nhận thông báo thành công!')
      
    } catch (error: any) {
      console.error('Lỗi khi đăng ký thông báo:', error)
      toast.error('Không thể đăng ký thông báo: ' + (error.message || 'Lỗi không xác định'))
    } finally {
      setLoading(false)
    }
  }

  const handleTestPush = async () => {
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Đã gửi thông báo test!')
      } else {
        toast.error(data.error || 'Lỗi khi gửi test')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    }
  }

  return (
    <section className="glass-card p-6 md:p-8 mt-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
        <BellRing className="text-primary" /> Thông báo ngoài app
      </h2>

      {isIOS && !isStandalone && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded-xl mb-6 flex gap-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p>
            <strong>Bạn đang dùng iPhone/iPad:</strong> Để nhận được thông báo, bạn cần bấm nút <span className="inline-block border border-amber-400 bg-white rounded px-1">Chia sẻ</span> ở Safari, chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>. Sau đó mở app từ icon vừa thêm để có thể bật quyền thông báo nhé.
          </p>
        </div>
      )}

      <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-lg">Thông báo đẩy (Push Notifications)</h3>
            <p className="text-sm text-foreground/70 mt-1">
              Bật để nhận nhắc nhở ngày kỷ niệm, chuỗi hoạt động, mood và chu kỳ ngay cả khi không mở app.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {permission === 'denied' ? (
              <div className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium text-sm">
                Đã bị chặn trong cài đặt
              </div>
            ) : isSubscribed ? (
              <div className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl font-bold text-sm flex items-center gap-2">
                <Bell size={16} /> Đang bật
              </div>
            ) : (
              <button 
                onClick={handleSubscribe}
                disabled={loading || (isIOS && !isStandalone)}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Bật thông báo'}
              </button>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="text-xs text-foreground/50 space-y-1 font-mono bg-background/50 p-2 rounded-lg inline-block">
            <p>Trạng thái: {permission}</p>
            <p>Service Worker: {'serviceWorker' in navigator ? 'Hỗ trợ' : 'Không hỗ trợ'}</p>
            <p>Đăng ký thiết bị: {isSubscribed ? 'Có' : 'Không'}</p>
          </div>

          <button 
            onClick={handleTestPush}
            disabled={!isSubscribed}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border hover:bg-secondary text-foreground text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smartphone size={16} /> Gửi thử thông báo
          </button>
        </div>
      </div>
    </section>
  )
}
