import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getTodayDate } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('_id gender')
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
    const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())

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
      const partner = partnerId
        ? await User.findById(partnerId).select('name gender').lean()
        : null
      return NextResponse.json({
        status: 'NONE',
        message: 'Hôm nay tụi mình chưa check-in mood',
        partnerGender: partner?.gender || 'unknown',
        myGender: user.gender || 'unknown',
        moods: {
          me: null,
          partner: null,
        },
      })
    }

    if (!myMood || !partnerMood) {
      const partner = partnerId
        ? await User.findById(partnerId).select('name gender').lean()
        : null
      return NextResponse.json({
        status: 'ONE_SIDED',
        message: myMood
          ? 'Bạn đã check-in, người ấy thì chưa'
          : 'Người ấy đã check-in, bạn thì chưa',
        partnerGender: partner?.gender || 'unknown',
        myGender: user.gender || 'unknown',
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

    const partnerDoc = partnerId
      ? await User.findById(partnerId).select('name gender').lean()
      : null
    const partnerName = partnerDoc && typeof partnerDoc === 'object' && 'name' in partnerDoc
      ? String(partnerDoc.name)
      : 'người ấy'
    
    const partnerGender = partnerDoc?.gender || 'unknown'
    const myGender = user.gender || 'unknown'

    if (myMood.mood === partnerMood.mood) {
      return NextResponse.json({
        status: 'MATCH',
        message: `Hôm nay hai bạn cùng mood: ${getMoodEmoji(myMood.mood)} ${myMood.mood}`,
        partnerGender,
        myGender,
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
        message: `Hôm nay mood khác nhau: bạn ${getMoodEmoji(myMood.mood)} ${myMood.mood} — ${partnerName} ${getMoodEmoji(partnerMood.mood)} ${partnerMood.mood}`,
        partnerGender,
        myGender,
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
    console.error('Get mood match error:', error?.message ?? error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to get mood match',
        hint: process.env.NODE_ENV === 'development' && error?.message
          ? String(error.message)
          : undefined,
      },
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
