import webPush from 'web-push'
import connectDB from './mongodb'
import { PushSubscription } from '@/models/PushSubscription'
import { NotificationLog } from '@/models/NotificationLog'
import { NotificationSetting } from '@/models/NotificationSetting'
import mongoose from 'mongoose'

// Initialize web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@myloveapp.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  actionUrl?: string
  type: 'streak' | 'anniversary' | 'customReminder' | 'mood' | 'cycle' | 'dailyMessage' | 'inactive' | 'test'
  dedupeKey: string
}

export async function sendPushToUser(userId: string | mongoose.Types.ObjectId, payload: PushPayload) {
  try {
    await connectDB()

    // 1. Check if user has push enabled globally
    const settings = await NotificationSetting.findOne({ userId })
    if (!settings || !settings.pushEnabled) {
      console.log(`Push skipped for user ${userId} - pushEnabled is false`)
      return false
    }

    // 2. Check dedupe key to avoid sending the exact same notification twice
    const existingLog = await NotificationLog.findOne({ userId, dedupeKey: payload.dedupeKey })
    if (existingLog) {
      console.log(`Push skipped for user ${userId} - dedupeKey ${payload.dedupeKey} already sent`)
      return false
    }

    // 3. Find all enabled subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId, enabled: true })
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`Push skipped for user ${userId} - no enabled subscriptions found`)
      return false
    }

    let sentCount = 0
    let failedCount = 0

    // 4. Send push to all subscriptions
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon.png',
            badge: payload.badge || '/icon.png',
            actionUrl: payload.actionUrl || '/',
            type: payload.type
          })
        )
        sentCount++
      } catch (error: any) {
        console.error(`Error sending to endpoint ${sub.endpoint}:`, error.statusCode)
        // If subscription is invalid/expired (404, 410), disable it
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndUpdate(sub._id, { enabled: false })
        }
        failedCount++
      }
    })

    await Promise.all(pushPromises)

    // 5. Log the notification
    const status = sentCount > 0 ? 'sent' : 'failed'
    
    await NotificationLog.create({
      userId,
      coupleId: settings.coupleId,
      type: payload.type,
      dedupeKey: payload.dedupeKey,
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      actionUrl: payload.actionUrl,
      status,
      sentAt: status === 'sent' ? new Date() : undefined,
      errorMessage: status === 'failed' ? 'All endpoints failed' : undefined
    })

    return sentCount > 0
  } catch (error) {
    console.error(`Failed to execute sendPushToUser for ${userId}:`, error)
    return false
  }
}
