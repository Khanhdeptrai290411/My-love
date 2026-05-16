import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Reminder } from '@/models/Reminder'
import { NotificationSetting } from '@/models/NotificationSetting'
import { sendPushToUser } from '@/lib/push'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // Basic protection (can be replaced with a real secret token for production)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const now = new Date()

    // Get current date/time in Ho Chi Minh timezone
    // Because server could be in UTC.
    const formatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const parts = formatter.formatToParts(now)
    const mapped = parts.reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {} as any)

    const todayKey = `${mapped.year}-${mapped.month}-${mapped.day}` // YYYY-MM-DD
    let currentHour = parseInt(mapped.hour)
    // Adjust hour if it parses "24" instead of "00"
    if (currentHour === 24) currentHour = 0
    
    const timeKey = `${String(currentHour).padStart(2, '0')}:${mapped.minute}` // HH:mm

    console.log(`[Cron] Checking custom reminders for date: ${todayKey}, time: ${timeKey}`)

    // Find all active custom reminders
    const reminders = await Reminder.find({
      isActive: true,
      startDate: { $lte: todayKey },
      endDate: { $gte: todayKey },
      remindStartTime: { $lte: timeKey },
      remindEndTime: { $gte: timeKey }
    })

    let sentCount = 0

    for (const reminder of reminders) {
      // Find all users involved (creator + partner)
      const settings = await NotificationSetting.find({
        $or: [
          { userId: reminder.userId },
          { coupleId: reminder.coupleId }
        ],
        pushEnabled: true,
        customReminderEnabled: true
      })

      for (const setting of settings) {
        const dedupeKey = `customReminder:${reminder._id.toString()}:${todayKey}:${setting.userId.toString()}`

        const success = await sendPushToUser(setting.userId, {
          title: `${reminder.icon || '✨'} ${reminder.title}`,
          body: reminder.content,
          actionUrl: '/settings', // Navigate to settings page where they can see reminders
          type: 'customReminder',
          dedupeKey
        })

        if (success) sentCount++
      }
    }

    return NextResponse.json({ success: true, processed: reminders.length, sent: sentCount })
  } catch (error: any) {
    console.error('Cron custom reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
