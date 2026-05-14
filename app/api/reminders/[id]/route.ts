import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Reminder } from '@/models/Reminder'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, content, startDate, endDate, icon, isActive } = await req.json()
    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 })

    const reminder = await Reminder.findOne({ _id: params.id, coupleId: couple._id.toString() })
    if (!reminder) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })

    if (title !== undefined) reminder.title = title
    if (content !== undefined) reminder.content = content
    if (startDate !== undefined) reminder.startDate = new Date(startDate)
    if (endDate !== undefined) reminder.endDate = new Date(endDate)
    if (icon !== undefined) reminder.icon = icon
    if (isActive !== undefined) reminder.isActive = isActive

    await reminder.save()
    return NextResponse.json({ reminder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 })

    const reminder = await Reminder.findOneAndDelete({ _id: params.id, coupleId: couple._id.toString() })
    if (!reminder) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
