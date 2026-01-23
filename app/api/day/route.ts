import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { MoodEvent } from '@/models/MoodEvent'
import { Post } from '@/models/Post'
import { DailyQuote } from '@/models/DailyQuote'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getFallbackQuote } from '@/lib/quotes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
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

    // Get quote
    let quote = await DailyQuote.findOne({
      coupleId: couple._id,
      date,
    })
    if (!quote) {
      const fallbackText = getFallbackQuote(date, couple._id.toString())
      quote = {
        text: fallbackText,
        source: 'fallback' as const,
        date,
      }
    }

    // Get mood events
    const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())
    
    const myMoodEvents = await MoodEvent.find({
      userId: user._id,
      date,
    }).sort({ createdAt: -1 })

    const partnerMoodEvents = partnerId
      ? await MoodEvent.find({
          userId: partnerId,
          date,
        }).sort({ createdAt: -1 })
      : []

    // Get dominant moods (highest intensity)
    const myDominant = myMoodEvents.length > 0 
      ? myMoodEvents.reduce((prev, curr) => 
          curr.intensity > prev.intensity ? curr : prev
        )
      : null
    
    const partnerDominant = partnerMoodEvents.length > 0
      ? partnerMoodEvents.reduce((prev, curr) => 
          curr.intensity > prev.intensity ? curr : prev
        )
      : null

    // Get posts
    const posts = await Post.find({
      coupleId: couple._id,
      date,
    })
      .populate('authorId', 'name email image')
      .sort({ createdAt: -1 })

    const myPosts = posts.filter(p => p.authorId.toString() === user._id.toString())
    const partnerPosts = posts.filter(p => p.authorId.toString() !== user._id.toString())

    const partner = partnerId ? await User.findById(partnerId) : null

    return NextResponse.json({
      date,
      quote: {
        text: quote.text,
        source: quote.source,
      },
      moods: {
        me: myDominant ? {
          id: myDominant._id.toString(),
          mood: myDominant.mood,
          intensity: myDominant.intensity,
          note: myDominant.note,
        } : null,
        partner: partnerDominant ? {
          id: partnerDominant._id.toString(),
          mood: partnerDominant.mood,
          intensity: partnerDominant.intensity,
          note: partnerDominant.note,
        } : null,
      },
      moodEvents: {
        me: myMoodEvents.map(e => ({
          id: e._id.toString(),
          mood: e.mood,
          intensity: e.intensity,
          note: e.note,
          createdAt: e.createdAt,
        })),
        partner: partnerMoodEvents.map(e => ({
          id: e._id.toString(),
          mood: e.mood,
          intensity: e.intensity,
          note: e.note,
          createdAt: e.createdAt,
        })),
      },
      posts: {
        me: myPosts.map(p => ({
          id: p._id.toString(),
          content: p.content,
          images: p.images,
          starred: p.starred,
          createdAt: p.createdAt,
          author: {
            name: (p.authorId as any).name,
            email: (p.authorId as any).email,
            image: (p.authorId as any).image,
          },
        })),
        partner: partnerPosts.map(p => ({
          id: p._id.toString(),
          content: p.content,
          images: p.images,
          starred: p.starred,
          createdAt: p.createdAt,
          author: {
            name: (p.authorId as any).name,
            email: (p.authorId as any).email,
            image: (p.authorId as any).image,
          },
        })),
      },
      starred: posts.filter(p => p.starred).map(p => ({
        id: p._id.toString(),
        authorId: p.authorId.toString(),
        content: p.content,
        images: p.images,
      })),
    })
  } catch (error: any) {
    console.error('Get day error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get day' },
      { status: 500 }
    )
  }
}
