import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Message } from '@/models/Message'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }

    const query: any = { coupleId: couple._id }
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) }
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name email image')
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json({
      messages: messages.reverse().map(m => ({
        id: m._id.toString(),
        senderId: m.senderId.toString(),
        sender: {
          name: (m.senderId as any).name,
          email: (m.senderId as any).email,
          image: (m.senderId as any).image,
        },
        text: m.text,
        imageUrl: m.imageUrl,
        audioUrl: m.audioUrl,
        createdAt: m.createdAt,
      })),
      nextCursor: messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null,
    })
  } catch (error: any) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get messages' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, imageUrl } = await req.json()
    if (!text && !imageUrl) {
      return NextResponse.json({ error: 'Text or image required' }, { status: 400 })
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

    const message = await Message.create({
      coupleId: couple._id,
      senderId: user._id,
      ...(text && text.trim() ? { text: text.trim() } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    })

    await message.populate('senderId', 'name email image')

    return NextResponse.json({
      message: {
        id: message._id.toString(),
        senderId: message.senderId.toString(),
        sender: {
          name: (message.senderId as any).name,
          email: (message.senderId as any).email,
          image: (message.senderId as any).image,
        },
        text: message.text,
        imageUrl: message.imageUrl,
        audioUrl: message.audioUrl,
        createdAt: message.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    )
  }
}

