import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Bạn hiện không ở trong couple nào' }, { status: 400 })
    }

    // Xóa user khỏi danh sách memberIds
    couple.memberIds = couple.memberIds.filter(
      (id: any) => id.toString() !== user._id.toString()
    )

    if (couple.memberIds.length === 0) {
      // Nếu không còn ai trong couple thì xóa luôn document
      await couple.deleteOne()
    } else {
      await couple.save()
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Leave couple error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to leave couple' },
      { status: 500 }
    )
  }
}

