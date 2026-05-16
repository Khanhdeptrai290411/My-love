import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push'
import { User } from '@/models/User'
import { NotificationSetting } from '@/models/NotificationSetting'
import connectDB from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const payload = {
      title: '💌 Test thông báo',
      body: 'Nếu bạn thấy thông báo này thì push notification đã hoạt động!',
      icon: '/icon.png',
      badge: '/icon.png',
      actionUrl: '/settings',
      type: 'test' as const,
      dedupeKey: `test:${Date.now()}:${user._id.toString()}`
    }

    // Đảm bảo pushEnabled = true (phòng trường hợp user đã subscribe lúc code cũ chưa update)
    await NotificationSetting.findOneAndUpdate(
      { userId: user._id },
      { $set: { pushEnabled: true } },
      { upsert: true }
    )

    const result = await sendPushToUser(user._id, payload)

    if (result) {
      return NextResponse.json({ success: true, message: 'Notification sent' })
    } else {
      // It might return false if the user has no subscriptions, or pushEnabled is false
      return NextResponse.json({ error: 'Không thể gửi. Vui lòng kiểm tra quyền hoặc xem bạn đã đăng ký thiết bị chưa.' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Test push error:', error)
    return NextResponse.json({ error: 'Lỗi server khi gửi push test' }, { status: 500 })
  }
}
