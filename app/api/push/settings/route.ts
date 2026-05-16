import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'
import { NotificationSetting } from '@/models/NotificationSetting'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let settings = await NotificationSetting.findOne({ userId: user._id })

    // If no settings exist yet, create default settings
    if (!settings) {
      const couple = await Couple.findOne({ memberIds: user._id }).select('_id')
      settings = await NotificationSetting.create({
        userId: user._id,
        coupleId: couple?._id
      })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Get notification settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const settings = await NotificationSetting.findOneAndUpdate(
      { userId: user._id },
      { $set: updates },
      { new: true, upsert: true }
    )

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('Update notification settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
