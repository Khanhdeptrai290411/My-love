import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getTodayDate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mood, intensity, note, eventId } = await req.json()
    if (!mood || intensity === undefined) {
      return NextResponse.json(
        { error: 'Mood and intensity required' },
        { status: 400 }
      )
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

    // If eventId provided, update existing event
    if (eventId) {
      const event = await MoodEvent.findOne({
        _id: eventId,
        userId: user._id,
      })

      if (!event) {
        return NextResponse.json({ error: 'Mood event not found' }, { status: 404 })
      }

      event.mood = mood
      event.intensity = Math.max(0, Math.min(3, intensity))
      event.note = note || ''
      await event.save()

      return NextResponse.json({
        event: {
          id: event._id.toString(),
          userId: event.userId.toString(),
          date: event.date,
          mood: event.mood,
          intensity: event.intensity,
          note: event.note,
          createdAt: event.createdAt,
        },
      })
    }

    // Create new event
    const moodEvent = await MoodEvent.create({
      coupleId: couple._id,
      userId: user._id,
      date: today,
      mood,
      intensity: Math.max(0, Math.min(3, intensity)),
      note: note || '',
    })

    return NextResponse.json({
      event: {
        id: moodEvent._id.toString(),
        userId: moodEvent.userId.toString(),
        date: moodEvent.date,
        mood: moodEvent.mood,
        intensity: moodEvent.intensity,
        note: moodEvent.note,
        createdAt: moodEvent.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Create/Update mood event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save mood event' },
      { status: 500 }
    )
  }
}
