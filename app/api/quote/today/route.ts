import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { DailyQuote } from '@/models/DailyQuote'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getFallbackQuote } from '@/lib/quotes'
import { getTodayDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

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

    const today = getTodayDate()

    let quote = await DailyQuote.findOne({
      coupleId: couple._id,
      date: today,
    })

    if (!quote) {
      const fallbackText = getFallbackQuote(today, couple._id.toString())
      quote = await DailyQuote.create({
        coupleId: couple._id,
        date: today,
        text: fallbackText,
        source: 'fallback',
      })
    }

    return NextResponse.json({
      date: quote.date,
      text: quote.text,
      source: quote.source,
    })
  } catch (error: any) {
    console.error('Get quote error:', error)
    // Fallback nếu có lỗi
    const today = getTodayDate()
    return NextResponse.json({
      date: today,
      text: 'Hôm nay em có muốn chia sẻ điều gì với anh không?',
      source: 'fallback',
    })
  }
}

