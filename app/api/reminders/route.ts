import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Reminder } from '@/models/Reminder'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 })

    const reminders = await Reminder.find({ coupleId: couple._id.toString() }).sort({ startDate: 1 })
    
    return NextResponse.json({ reminders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, content, startDate, endDate, icon, isActive } = await req.json()
    if (!title || !startDate || !endDate || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 })

    const newReminder = await Reminder.create({
      coupleId: couple._id.toString(),
      title,
      content,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      icon: icon || '✨',
      isActive: isActive !== undefined ? isActive : true
    })

    return NextResponse.json({ reminder: newReminder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
