import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getDaysInYear, getDateKey } from '@/lib/review-utils'
import mongoose from 'mongoose'

// Mood color mapping
const MOOD_COLORS: Record<string, string> = {
  happy: 'yellow',
  sad: 'purple',
  calm: 'blue',
  stressed: 'red',
  excited: 'green',
  tired: 'gray',
  anxious: 'orange',
  grateful: 'pink',
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const view = searchParams.get('view') || 'couple' // couple | me | partner

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }

    const days = getDaysInYear(year)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    let userIds: mongoose.Types.ObjectId[] = []
    if (view === 'me') {
      userIds = [user._id]
    } else if (view === 'partner') {
      const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())
      if (partnerId) {
        userIds = [partnerId]
      }
    } else {
      userIds = couple.memberIds
    }

    if (view === 'couple') {
      // For couple view, return moods for both users separately
      const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())
      
      // Get mood events for both users
      const myMoodEvents = await MoodEvent.find({
        coupleId: couple._id,
        date: { $gte: startDate, $lte: endDate },
        userId: user._id,
      }).sort({ date: 1, intensity: -1, createdAt: -1 })

      const partnerMoodEvents = partnerId
        ? await MoodEvent.find({
            coupleId: couple._id,
            date: { $gte: startDate, $lte: endDate },
            userId: partnerId,
          }).sort({ date: 1, intensity: -1, createdAt: -1 })
        : []

      // Group by date and find dominant mood for each user
      const myMoodByDate: Record<string, { mood: string; intensity: number }> = {}
      const partnerMoodByDate: Record<string, { mood: string; intensity: number }> = {}

      myMoodEvents.forEach((event) => {
        const dateKey = event.date
        if (!myMoodByDate[dateKey] || event.intensity > myMoodByDate[dateKey].intensity) {
          myMoodByDate[dateKey] = { mood: event.mood, intensity: event.intensity }
        }
      })

      partnerMoodEvents.forEach((event) => {
        const dateKey = event.date
        if (!partnerMoodByDate[dateKey] || event.intensity > partnerMoodByDate[dateKey].intensity) {
          partnerMoodByDate[dateKey] = { mood: event.mood, intensity: event.intensity }
        }
      })

      // Build result array with both moods
      const result = days.map(date => {
        const dateKey = getDateKey(date)
        const myMood = myMoodByDate[dateKey]
        const partnerMood = partnerMoodByDate[dateKey]
        return {
          date: dateKey,
          me: myMood ? { mood: myMood.mood, intensity: myMood.intensity } : null,
          partner: partnerMood ? { mood: partnerMood.mood, intensity: partnerMood.intensity } : null,
        }
      })

      return NextResponse.json(result)
    }

    // For 'me' or 'partner' view, return single mood
    const moodEvents = await MoodEvent.find({
      coupleId: couple._id,
      date: { $gte: startDate, $lte: endDate },
      userId: { $in: userIds },
    }).sort({ date: 1, intensity: -1, createdAt: -1 })

    // Group by date and find dominant mood (highest intensity)
    const moodByDate: Record<string, { mood: string; intensity: number }> = {}

    moodEvents.forEach((event) => {
      const dateKey = event.date
      if (!moodByDate[dateKey]) {
        moodByDate[dateKey] = { mood: event.mood, intensity: event.intensity }
      } else {
        // Keep the one with highest intensity, or latest if tie
        if (event.intensity > moodByDate[dateKey].intensity) {
          moodByDate[dateKey] = { mood: event.mood, intensity: event.intensity }
        }
      }
    })

    // Build result array
    const result = days.map(date => {
      const dateKey = getDateKey(date)
      const dayMood = moodByDate[dateKey]
      return {
        date: dateKey,
        mood: dayMood?.mood || null,
        intensity: dayMood?.intensity || 0,
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get review' },
      { status: 500 }
    )
  }
}
