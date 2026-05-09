import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Anniversary } from '@/models/Anniversary'
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

    const events = await Anniversary.find({ coupleId: couple._id.toString() }).sort({ date: 1 })
    
    // Also include the start date as an implicit anniversary!
    let implicitEvents = []
    if (couple.startDate) {
      implicitEvents.push({
        _id: 'default_start_date',
        title: 'Ngày chính thức quen nhau',
        date: couple.startDate,
        description: 'Khởi đầu một tình yêu tuyệt vời',
        isDefault: true
      })
    }

    return NextResponse.json({ events: [...implicitEvents, ...events] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, date, description } = await req.json()
    if (!title || !date) return NextResponse.json({ error: 'Missing title or date' }, { status: 400 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 })

    const newEvent = await Anniversary.create({
      coupleId: couple._id.toString(),
      title,
      date: new Date(date),
      description
    })

    return NextResponse.json({ event: newEvent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
