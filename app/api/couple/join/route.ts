import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { decodeDateFromInviteCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteCode } = await req.json()
    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code required' }, { status: 400 })
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

    // Try to find couple by invite code
    const couple = await Couple.findOne({ inviteCode: inviteCode.toUpperCase() })
    if (!couple) {
      return NextResponse.json({ error: 'Mã mời không hợp lệ' }, { status: 404 })
    }

    if (couple.memberIds.length >= 2) {
      return NextResponse.json({ error: 'Couple đã đầy' }, { status: 400 })
    }

    couple.memberIds.push(user._id)
    await couple.save()

    return NextResponse.json({
      couple: {
        id: couple._id.toString(),
        inviteCode: couple.inviteCode,
        startDate: couple.startDate,
        memberIds: couple.memberIds.map(id => id.toString()),
      },
    })
  } catch (error: any) {
    console.error('Join couple error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join couple' },
      { status: 500 }
    )
  }
}

