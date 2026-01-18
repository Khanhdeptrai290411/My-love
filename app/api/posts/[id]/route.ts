import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Post } from '@/models/Post'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'
import { Comment } from '@/models/Comment'

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
    }).populate('authorId', 'name email image')

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({
      post: {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        author: {
          name: (post.authorId as any).name,
          email: (post.authorId as any).email,
          image: (post.authorId as any).image,
        },
        date: post.date,
        content: post.content,
        images: post.images,
        starred: post.starred,
        createdAt: post.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      authorId: user._id,
      coupleId: couple._id,
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Delete all comments
    await Comment.deleteMany({ postId: post._id })
    
    // Delete post
    await Post.deleteOne({ _id: post._id })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error: any) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    )
  }
}
