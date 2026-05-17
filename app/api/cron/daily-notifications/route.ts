import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { NotificationSetting } from '@/models/NotificationSetting'
import { Reminder } from '@/models/Reminder'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { Mood } from '@/models/Mood'
import { Post } from '@/models/Post'
import { Anniversary } from '@/models/Anniversary'
import { sendPushToUser } from '@/lib/push'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const parts = formatter.formatToParts(now)
    const mapped = parts.reduce((acc: any, part: any) => {
      acc[part.type] = part.value
      return acc
    }, {} as any)
    const todayKey = `${mapped.year}-${mapped.month}-${mapped.day}`

    // 1. Get all users with push enabled
    const allSettings = await NotificationSetting.find({ pushEnabled: true })
    let totalSent = 0

    for (const setting of allSettings) {
      const userId = setting.userId
      const coupleId = setting.coupleId
      if (!coupleId) continue

      // Find user and couple info
      const user = await User.findById(userId)
      if (!user) continue
      
      const couple = await Couple.findById(coupleId)
      if (!couple) continue

      const partnerId = couple.memberIds.find((id: any) => id.toString() !== userId.toString())
      const partner = partnerId ? await User.findById(partnerId) : null

      // --- 1. STREAK REMINDER ---
      if (setting.streakEnabled) {
        // Just a simple "Don't forget to check in" if they haven't today
        const todayPost = await Post.findOne({ authorId: userId, date: todayKey })
        if (!todayPost) {
          await sendPushToUser(userId, {
            title: '🔥 Duy trì ngọn lửa',
            body: 'Hôm nay bạn chưa đăng khoảnh khắc nào. Hãy ghi lại kỷ niệm để duy trì streak nhé!',
            type: 'streak',
            dedupeKey: `streak:${todayKey}:${userId}`
          })
          totalSent++
        }
      }

      // --- 2. ANNIVERSARY REMINDER ---
      if (setting.anniversaryEnabled) {
        // Look for anniversaries in the next 3 days
        const threeDaysLater = new Date(now)
        threeDaysLater.setDate(threeDaysLater.getDate() + 3)
        
        const upcomingEvents = await Anniversary.find({
          coupleId,
          date: { $gte: now, $lte: threeDaysLater }
        })

        for (const event of upcomingEvents) {
          const daysLeft = Math.ceil((event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          await sendPushToUser(userId, {
            title: '📅 Sắp đến ngày kỷ niệm',
            body: `Chỉ còn ${daysLeft} ngày nữa là đến: ${event.title}. Bạn đã chuẩn bị gì chưa?`,
            type: 'anniversary',
            dedupeKey: `anniversary:${event._id}:${todayKey}:${userId}`
          })
          totalSent++
        }
      }

      // CYCLE & DAILY MESSAGE → moved to morning-notifications cron (08:00 VN)

      // --- 4. MOOD CHECK-IN REMINDER ---
      if (setting.moodEnabled) {
        const todayMood = await Mood.findOne({ userId, date: todayKey })
        if (!todayMood) {
          await sendPushToUser(userId, {
            title: '🧠 Hôm nay bạn thấy thế nào?',
            body: 'Đừng quên ghi lại tâm trạng hôm nay để người ấy hiểu bạn hơn nhé.',
            type: 'mood',
            dedupeKey: `mood:${todayKey}:${userId}`
          })
          totalSent++
        }
      }

      // DAILY MESSAGE → moved to morning-notifications cron (08:00 VN)


      // --- 6. INACTIVE RELATIONSHIP REMINDER ---
      if (setting.inactiveEnabled) {
        const lastPost = await Post.findOne({ coupleId }).sort({ createdAt: -1 })
        if (lastPost) {
          const daysInactive = Math.floor((now.getTime() - lastPost.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          if (daysInactive >= 7) {
            await sendPushToUser(userId, {
              title: '🥺 Đã lâu không gặp',
              body: `Đã ${daysInactive} ngày rồi hai bạn chưa đăng khoảnh khắc mới. Hãy hâm nóng tình cảm nhé!`,
              type: 'inactive',
              dedupeKey: `inactive:${todayKey}:${userId}`
            })
            totalSent++
          }
        }
      }

      // --- 7. CUSTOM REMINDER DIGEST ---
      if (setting.customReminderEnabled) {
        const reminders = await Reminder.find({
          isActive: true,
          $or: [
            { userId },
            { coupleId }
          ],
          startDate: { $lte: todayKey },
          endDate: { $gte: todayKey }
        })

        if (reminders.length > 0) {
          let title = ''
          let body = ''

          if (reminders.length === 1) {
            const r = reminders[0]
            title = `🔔 Lời nhắc hôm nay`
            body = `${r.icon || '✨'} ${r.title}: ${r.content} (${r.remindStartTime})`
          } else {
            title = `🔔 Bạn có ${reminders.length} lời nhắc hôm nay`
            body = reminders.map((r: any) => `${r.icon || '✨'} ${r.title} (${r.remindStartTime})`).join(', ')
            if (body.length > 100) body = body.substring(0, 97) + '...'
          }

          await sendPushToUser(userId, {
            title,
            body,
            type: 'customReminder',
            dedupeKey: `customReminderDigest:${todayKey}:${userId}`
          })
          totalSent++
        }
      }
    }

    return NextResponse.json({ success: true, totalSent })
  } catch (error: any) {
    console.error('Daily notifications cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
