import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Anniversary } from '@/models/Anniversary'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    const couple = await Couple.findOne({ members: user._id })
    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 })

    const event = await Anniversary.findOne({ _id: params.id, coupleId: couple._id.toString() })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    await event.deleteOne()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
