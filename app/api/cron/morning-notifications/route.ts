import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { NotificationSetting } from '@/models/NotificationSetting'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { sendPushToUser } from '@/lib/push'
import { getCycleDayInfo, getCycleForecast } from '@/lib/cycle'
import { getFallbackQuote } from '@/lib/quotes'

export const dynamic = 'force-dynamic'

// Runs at 01:00 UTC = 08:00 Vietnam time every day
// Handles: Cycle forecast + Daily love message
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

    const allSettings = await NotificationSetting.find({ pushEnabled: true })
    let totalSent = 0

    for (const setting of allSettings) {
      const userId = setting.userId
      const coupleId = setting.coupleId
      if (!coupleId) continue

      const user = await User.findById(userId)
      if (!user) continue

      const couple = await Couple.findById(coupleId)
      if (!couple) continue

      const partnerId = couple.memberIds.find((id: any) => id.toString() !== userId.toString())
      const partner = partnerId ? await User.findById(partnerId) : null

      // --- 1. CYCLE FORECAST (Morning: 8AM) ---
      if (setting.cycleEnabled && couple.cycleSettings) {
        const isMale = user.gender === 'male'
        const cycleInfo = getCycleDayInfo(now, couple.cycleSettings as any)
        const forecast = getCycleForecast(cycleInfo.phase)

        if (forecast) {
          let body = ''

          if (isMale && partner?.gender === 'female') {
            body = `Hôm nay người ấy đang ở giai đoạn ${forecast.status}. ${forecast.advice}`
          } else if (user.gender === 'female') {
            body = `Bạn đang ở giai đoạn ${forecast.status}. Hãy chú ý sức khỏe nhé!`
          }

          if (body) {
            await sendPushToUser(userId, {
              title: '🌸 Dự báo chu kỳ hôm nay',
              body,
              type: 'cycle',
              dedupeKey: `cycle:${todayKey}:${userId}`
            })
            totalSent++
          }
        }
      }

      // --- 2. DAILY LOVE MESSAGE (Morning: 8AM) ---
      if (setting.dailyMessageEnabled) {
        const quote = getFallbackQuote(todayKey, coupleId.toString(), partner?.gender || 'unknown')
        await sendPushToUser(userId, {
          title: '💌 Lời nhắn buổi sáng',
          body: quote,
          type: 'dailyMessage',
          dedupeKey: `dailyMessage:${todayKey}:${userId}`
        })
        totalSent++
      }
    }

    return NextResponse.json({ success: true, totalSent, ran: 'morning-notifications', time: '08:00 VN' })
  } catch (error: any) {
    console.error('Morning notifications cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
