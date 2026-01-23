import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getTodayDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }

    const today = getTodayDate()
    const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())

    // Get all mood events for today
    const myEvents = await MoodEvent.find({
      userId: user._id,
      date: today,
    }).sort({ intensity: -1, createdAt: -1 })

    const partnerEvents = partnerId
      ? await MoodEvent.find({
          userId: partnerId,
          date: today,
        }).sort({ intensity: -1, createdAt: -1 })
      : []

    // Get dominant mood (highest intensity)
    const myDominant = myEvents.length > 0 ? myEvents[0] : null
    const partnerDominant = partnerEvents.length > 0 ? partnerEvents[0] : null

    return NextResponse.json({
      moods: {
        me: myDominant
          ? {
              id: myDominant._id.toString(),
              mood: myDominant.mood,
              intensity: myDominant.intensity,
              note: myDominant.note,
            }
          : null,
        partner: partnerDominant
          ? {
              id: partnerDominant._id.toString(),
              mood: partnerDominant.mood,
              intensity: partnerDominant.intensity,
              note: partnerDominant.note,
            }
          : null,
      },
      events: {
        me: myEvents.map(e => ({
          id: e._id.toString(),
          mood: e.mood,
          intensity: e.intensity,
          note: e.note,
          createdAt: e.createdAt,
        })),
        partner: partnerEvents.map(e => ({
          id: e._id.toString(),
          mood: e.mood,
          intensity: e.intensity,
          note: e.note,
          createdAt: e.createdAt,
        })),
      },
    })
  } catch (error: any) {
    console.error('Get today moods error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get today moods' },
      { status: 500 }
    )
  }
}
