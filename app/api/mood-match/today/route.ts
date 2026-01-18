import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getTodayDate } from '@/lib/utils'

export async function GET() {
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

    if (couple.memberIds.length < 2) {
      return NextResponse.json({
        status: 'WAITING',
        message: 'Đợi người kia join nha',
      })
    }

    const today = getTodayDate()
    const partnerId = couple.memberIds.find(id => id.toString() !== user._id.toString())

    // Get dominant moods (highest intensity) for today
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

    const myMood = myEvents.length > 0 ? myEvents[0] : null
    const partnerMood = partnerEvents.length > 0 ? partnerEvents[0] : null

    if (!myMood && !partnerMood) {
      return NextResponse.json({
        status: 'NONE',
        message: 'Hôm nay tụi mình chưa check-in mood',
        moods: {
          me: null,
          partner: null,
        },
      })
    }

    if (!myMood || !partnerMood) {
      const partner = await User.findById(partnerId)
      return NextResponse.json({
        status: 'ONE_SIDED',
        message: myMood
          ? 'Bạn đã check-in, người ấy thì chưa'
          : 'Người ấy đã check-in, bạn thì chưa',
        moods: {
          me: myMood
            ? {
                mood: myMood.mood,
                intensity: myMood.intensity,
              }
            : null,
          partner: partnerMood
            ? {
                mood: partnerMood.mood,
                intensity: partnerMood.intensity,
              }
            : null,
        },
      })
    }

    const partner = await User.findById(partnerId)
    if (myMood.mood === partnerMood.mood) {
      return NextResponse.json({
        status: 'MATCH',
        message: `Hôm nay hai bạn cùng mood: ${getMoodEmoji(myMood.mood)} ${myMood.mood}`,
        moods: {
          me: {
            mood: myMood.mood,
            intensity: myMood.intensity,
          },
          partner: {
            mood: partnerMood.mood,
            intensity: partnerMood.intensity,
          },
        },
      })
    } else {
      return NextResponse.json({
        status: 'MISMATCH',
        message: `Hôm nay mood khác nhau: bạn ${getMoodEmoji(myMood.mood)} ${myMood.mood} — ${partner?.name || 'người ấy'} ${getMoodEmoji(partnerMood.mood)} ${partnerMood.mood}`,
        moods: {
          me: {
            mood: myMood.mood,
            intensity: myMood.intensity,
          },
          partner: {
            mood: partnerMood.mood,
            intensity: partnerMood.intensity,
          },
        },
      })
    }
  } catch (error: any) {
    console.error('Get mood match error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get mood match' },
      { status: 500 }
    )
  }
}

function getMoodEmoji(mood: string): string {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    calm: '😌',
    stressed: '😣',
    excited: '🤩',
    tired: '😴',
    anxious: '😰',
    grateful: '🙏',
  }
  return emojiMap[mood] || '😊'
}
