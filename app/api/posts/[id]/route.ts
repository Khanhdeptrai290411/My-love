import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Post } from '@/models/Post'
import { User } from '@/models/User'
import { Couple } from '@/models/Couple'
import { Comment } from '@/models/Comment'
import mongoose from 'mongoose'

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
    }).lean() as any

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch author separately
    let authorId = ''
    let author: any = {
      name: 'Người dùng',
      email: '',
      image: null,
    }

    if (post.authorId) {
      // Handle ObjectId from lean()
      if (post.authorId._id) {
        authorId = post.authorId._id.toString()
      } else if (post.authorId.toString && typeof post.authorId.toString === 'function') {
        authorId = post.authorId.toString()
      } else if (typeof post.authorId === 'string') {
        authorId = post.authorId
      }

      if (authorId) {
        try {
          const authorDoc = await User.findById(authorId)
            .select('name email image')
            .lean() as any
          if (authorDoc) {
            author = {
              name: authorDoc.name || 'Người dùng',
              email: authorDoc.email || '',
              image: authorDoc.image || null,
            }
          }
        } catch (authorError: any) {
          console.error('Error fetching author:', authorError?.message || authorError)
          // Use fallback author
        }
      }
    }

    // Safely serialize dates
    let createdAt = new Date().toISOString()
    if (post.createdAt) {
      if (post.createdAt instanceof Date) {
        createdAt = post.createdAt.toISOString()
      } else if (typeof post.createdAt === 'string') {
        createdAt = post.createdAt
      } else {
        createdAt = new Date(post.createdAt).toISOString()
      }
    }

    return NextResponse.json({
      post: {
        id: String(post._id || ''),
        authorId: String(authorId || ''),
        author: author,
        date: String(post.date || ''),
        content: String(post.content || ''),
        images: Array.isArray(post.images) ? post.images.map((img: any) => {
          if (typeof img === 'string') return { url: img }
          if (typeof img === 'object' && img !== null) {
            return {
              url: String(img.url || ''),
              ...(img.publicId && { publicId: String(img.publicId) }),
            }
          }
          return { url: '' }
        }) : [],
        starred: Boolean(post.starred || false),
        createdAt: String(createdAt),
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
