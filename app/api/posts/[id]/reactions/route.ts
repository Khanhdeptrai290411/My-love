import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Reaction, ReactionType } from '@/models/Reaction'
import { Post } from '@/models/Post'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'

export const runtime = 'nodejs'

// Get all reactions for a post
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

    const reactions = await Reaction.find({ postId: post._id })
      .populate('userId', 'name email image')

    // Group reactions by type
    const reactionsByType: Record<ReactionType, any[]> = {
      like: [],
      love: [],
      haha: [],
      wow: [],
      sad: [],
      angry: [],
    }

    reactions.forEach((reaction) => {
      const type = reaction.type as ReactionType
      if (reactionsByType[type]) {
        reactionsByType[type].push({
          id: reaction._id.toString(),
          userId: (reaction.userId as any)._id.toString(),
          user: {
            name: (reaction.userId as any).name,
            email: (reaction.userId as any).email,
            image: (reaction.userId as any).image,
          },
          type: reaction.type,
        })
      }
    })

    // Get current user's reaction
    const myReaction = reactions.find((r) => (r.userId as any)._id.toString() === user._id.toString())

    return NextResponse.json({
      reactions: reactionsByType,
      myReaction: myReaction ? {
        id: myReaction._id.toString(),
        type: myReaction.type,
      } : null,
    })
  } catch (error: any) {
    console.error('Get reactions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get reactions' },
      { status: 500 }
    )
  }
}

// Add or update reaction
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await req.json()
    if (!type || !['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
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

    // Find existing reaction or create new one
    const existingReaction = await Reaction.findOne({
      postId: post._id,
      userId: user._id,
    })

    let reaction
    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type as ReactionType
      await existingReaction.save()
      reaction = existingReaction
    } else {
      // Create new reaction
      reaction = await Reaction.create({
        postId: post._id,
        userId: user._id,
        type: type as ReactionType,
      })
    }

    await reaction.populate('userId', 'name email image')

    return NextResponse.json({
      reaction: {
        id: reaction._id.toString(),
        userId: (reaction.userId as any)._id.toString(),
        user: {
          name: (reaction.userId as any).name,
          email: (reaction.userId as any).email,
          image: (reaction.userId as any).image,
        },
        type: reaction.type,
      },
    })
  } catch (error: any) {
    console.error('Create reaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create reaction' },
      { status: 500 }
    )
  }
}

// Remove reaction
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
      coupleId: couple._id,
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await Reaction.deleteOne({
      postId: post._id,
      userId: user._id,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete reaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete reaction' },
      { status: 500 }
    )
  }
}
