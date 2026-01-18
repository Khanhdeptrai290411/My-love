import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { generateInviteCodeFromDate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { startDate } = await req.json()
    if (!startDate) {
      return NextResponse.json({ error: 'Start date required' }, { status: 400 })
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Validate date is not in the future
    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (start > today) {
      return NextResponse.json({ error: 'Ngày hẹn hò không thể là ngày tương lai' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already in a couple
    const existingCouple = await Couple.findOne({ memberIds: user._id })
    if (existingCouple) {
      return NextResponse.json({ error: 'Already in a couple' }, { status: 400 })
    }

    const inviteCode = generateInviteCodeFromDate(startDate)
    const couple = await Couple.create({
      memberIds: [user._id],
      inviteCode,
      startDate,
    })

    return NextResponse.json({
      couple: {
        id: couple._id.toString(),
        inviteCode: couple.inviteCode,
        startDate: couple.startDate,
        memberIds: couple.memberIds.map(id => id.toString()),
      },
    })
  } catch (error: any) {
    console.error('Create couple error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create couple' },
      { status: 500 }
    )
  }
}

