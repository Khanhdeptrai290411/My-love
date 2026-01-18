import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Comment } from '@/models/Comment'
import { Post } from '@/models/Post'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }

    const post = await Post.findOne({
      _id: params.id,
      coupleId: couple._id,
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comments = await Comment.find({ postId: post._id })
      .populate('userId', 'name email image')
      .sort({ createdAt: 1 })

    return NextResponse.json({
      comments: comments.map(c => ({
        id: c._id.toString(),
        userId: c.userId.toString(),
        user: {
          name: (c.userId as any).name,
          email: (c.userId as any).email,
          image: (c.userId as any).image,
        },
        text: c.text,
        createdAt: c.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text } = await req.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
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

    const post = await Post.findOne({
      _id: params.id,
      coupleId: couple._id,
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comment = await Comment.create({
      postId: post._id,
      userId: user._id,
      text: text.trim(),
    })

    await comment.populate('userId', 'name email image')

    return NextResponse.json({
      comment: {
        id: comment._id.toString(),
        userId: comment.userId.toString(),
        user: {
          name: (comment.userId as any).name,
          email: (comment.userId as any).email,
          image: (comment.userId as any).image,
        },
        text: comment.text,
        createdAt: comment.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}

