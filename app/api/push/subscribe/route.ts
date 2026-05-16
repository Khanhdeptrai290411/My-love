import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'
import { PushSubscription } from '@/models/PushSubscription'
import { NotificationSetting } from '@/models/NotificationSetting'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subscription, userAgent, platform, deviceName } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await Couple.findOne({ memberIds: user._id }).select('_id')

    // Upsert the subscription using the endpoint as the unique identifier
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId: user._id,
          coupleId: couple?._id,
          keys: subscription.keys,
          userAgent,
          platform,
          deviceName,
          enabled: true,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    )

    // Automatically enable push notifications in user settings
    await NotificationSetting.findOneAndUpdate(
      { userId: user._id },
      { $set: { pushEnabled: true } },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Push subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
