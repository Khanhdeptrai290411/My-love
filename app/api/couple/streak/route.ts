import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
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

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }

    const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())

    // Fetch mood events for both users to determine activity
    // For performance, we can just fetch the dates where events exist
    const userEvents = await MoodEvent.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: "$date" } }
    ])

    const partnerEvents = partnerId ? await MoodEvent.aggregate([
      { $match: { userId: partnerId } },
      { $group: { _id: "$date" } }
    ]) : []

    const userActiveDates = new Set(userEvents.map(e => e._id))
    const partnerActiveDates = new Set(partnerEvents.map(e => e._id))

    // Collect all dates
    const allDates = new Set([...Array.from(userActiveDates), ...Array.from(partnerActiveDates)])

    const activityLogs = Array.from(allDates).map((date: any) => ({
      date,
      userActive: userActiveDates.has(date),
      partnerActive: partnerActiveDates.has(date)
    }))

    return NextResponse.json({ activityLogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
