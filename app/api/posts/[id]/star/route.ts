import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Post } from '@/models/Post'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { starred } = await req.json()

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

    post.starred = starred !== undefined ? starred : !post.starred
    await post.save()

    return NextResponse.json({
      post: {
        id: post._id.toString(),
        starred: post.starred,
      },
    })
  } catch (error: any) {
    console.error('Star post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to star post' },
      { status: 500 }
    )
  }
}

