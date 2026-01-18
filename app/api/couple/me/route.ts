import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'

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

    // Use lean() to get plain object and ensure all fields are included
    const couple = await Couple.findOne({ memberIds: user._id })
      .populate('memberIds', 'name email image')
      .lean()

    if (!couple) {
      return NextResponse.json({ couple: null })
    }

    const members = await User.find({ _id: { $in: couple.memberIds } })
      .select('name email image')

    // Determine creator (first member)
    const creatorId = couple.memberIds[0].toString()
    
    // Debug: log startDate to ensure it's being retrieved
    console.log('Couple startDate from DB:', couple.startDate)
    console.log('Full couple object:', JSON.stringify(couple, null, 2))
    
    return NextResponse.json({
      couple: {
        id: couple._id.toString(),
        inviteCode: couple.inviteCode,
        startDate: couple.startDate || null, // Explicitly return null if undefined
        creatorId,
        members: members.map(m => ({
          id: m._id.toString(),
          name: m.name,
          email: m.email,
          image: m.image,
        })),
      },
    })
  } catch (error: any) {
    console.error('Get couple error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get couple' },
      { status: 500 }
    )
  }
}

