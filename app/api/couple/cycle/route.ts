import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lastPeriodStart, periodLength, cycleLength } = await req.json()

    if (!lastPeriodStart || !periodLength || !cycleLength) {
      return NextResponse.json({ error: 'Thiếu thông tin chu kỳ' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const cycleSettings = {
      lastPeriodStart,
      periodLength: Number(periodLength),
      cycleLength: Number(cycleLength),
      updatedAt: new Date()
    }
    
    await Couple.updateOne(
      { _id: couple._id },
      { $set: { cycleSettings } },
      { strict: false } // Bỏ qua strict mode để lưu fields mới nếu schema bị cache
    )

    return NextResponse.json({ success: true, cycleSettings })
  } catch (error: any) {
    console.error('Update cycle settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update cycle settings' },
      { status: 500 }
    )
  }
}
