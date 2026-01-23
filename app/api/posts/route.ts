import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Post } from '@/models/Post'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getTodayDate } from '@/lib/utils'

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || 'week'
    const filter = searchParams.get('filter') || 'both' // 'me' | 'partner' | 'both'

    let startDate = getTodayDate()
    if (range === 'month') {
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      startDate = date.toISOString().split('T')[0]
    } else {
      const date = new Date()
      date.setDate(date.getDate() - 7)
      startDate = date.toISOString().split('T')[0]
    }

    // Build query based on filter
    let partnerId: any = null
    try {
      if (Array.isArray(couple.memberIds)) {
        partnerId = couple.memberIds.find((id: any) => {
          try {
            return id?.toString() !== user._id?.toString()
          } catch {
            return false
          }
        })
      }
    } catch (err) {
      console.error('Error finding partner ID:', err)
    }
    
    let authorFilter: any = {}
    
    if (filter === 'me') {
      authorFilter.authorId = user._id
    } else if (filter === 'partner') {
      if (!partnerId) {
        return NextResponse.json({ posts: [] })
      }
      authorFilter.authorId = partnerId
    }
    // If filter === 'both', don't add authorFilter (show all)

    const query: any = {
      coupleId: couple._id,
      date: { $gte: startDate },
      ...authorFilter,
    }

    let posts: any[] = []
    try {
      posts = await Post.find(query)
        .populate('authorId', 'name email image')
        .sort({ date: -1, createdAt: -1 })
    } catch (queryError: any) {
      console.error('Error querying posts:', queryError?.message || queryError)
      return NextResponse.json(
        { error: 'Failed to query posts', details: queryError?.message },
        { status: 500 }
      )
    }

    // Convert to plain objects safely
    const postsData = posts.map((p: any) => {
      try {
        // Ensure images array is properly formatted
        const postImages = Array.isArray(p.images) ? p.images : []
        
        // Handle populated authorId - could be ObjectId or populated object
        let authorId = ''
        let author: any = {
          name: 'Người dùng',
          email: '',
          image: null,
        }
        
        if (p.authorId) {
          if (p.authorId._id) {
            // Populated object (Mongoose document)
            authorId = p.authorId._id.toString()
            author = {
              name: p.authorId.name || 'Người dùng',
              email: p.authorId.email || '',
              image: p.authorId.image || null,
            }
          } else if (p.authorId.toString) {
            // Just ObjectId
            authorId = p.authorId.toString()
          }
        }

        // Safely serialize dates
        let createdAt = new Date().toISOString()
        if (p.createdAt) {
          if (p.createdAt instanceof Date) {
            createdAt = p.createdAt.toISOString()
          } else if (typeof p.createdAt === 'string') {
            createdAt = p.createdAt
          } else {
            createdAt = new Date(p.createdAt).toISOString()
          }
        }

        // Ensure all values are serializable
        const result = {
          id: String(p._id || ''),
          authorId: String(authorId || ''),
          author: {
            name: String(author.name || 'Người dùng'),
            email: String(author.email || ''),
            image: author.image ? String(author.image) : null,
          },
          date: String(p.date || ''),
          content: String(p.content || ''),
          images: postImages.map((img: any) => {
            if (typeof img === 'string') return { url: img }
            if (typeof img === 'object' && img !== null) {
              return {
                url: String(img.url || ''),
                ...(img.publicId && { publicId: String(img.publicId) }),
              }
            }
            return { url: '' }
          }),
          starred: Boolean(p.starred || false),
          createdAt: String(createdAt),
        }
        return result
      } catch (mapError: any) {
        console.error('Error mapping post:', mapError?.message || mapError, {
          postId: p._id?.toString(),
          hasAuthorId: !!p.authorId,
          errorType: typeof mapError,
        })
        // Return safe fallback - ensure all values are serializable
        try {
          return {
            id: String(p._id || ''),
            authorId: '',
            author: {
              name: 'Người dùng',
              email: '',
              image: null,
            },
            date: String(p.date || ''),
            content: String(p.content || ''),
            images: [],
            starred: false,
            createdAt: new Date().toISOString(),
          }
        } catch (fallbackError: any) {
          console.error('Error in fallback:', fallbackError)
          // Ultimate fallback
          return {
            id: '',
            authorId: '',
            author: { name: 'Người dùng', email: '', image: null },
            date: '',
            content: '',
            images: [],
            starred: false,
            createdAt: new Date().toISOString(),
          }
        }
      }
    })

    try {
      return NextResponse.json({ posts: postsData })
    } catch (jsonError: any) {
      console.error('Error serializing JSON:', jsonError?.message || jsonError)
      // Try to return at least empty array
      return NextResponse.json({ posts: [] })
    }
  } catch (error: any) {
    console.error('Get posts error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get posts',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
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

    const { content, images, postId } = await req.json()
    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }
    
    // Ensure images is an array
    const postImages = Array.isArray(images) ? images : []
    console.log('Received images:', postImages.length, postImages.map((img: any) => ({ url: img.url?.substring(0, 50), hasPublicId: !!img.publicId })))

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }

    let post
    if (postId) {
      // Update existing post
      post = await Post.findOne({
        _id: postId,
        authorId: user._id,
        coupleId: couple._id,
      })
      
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      post.content = content
      post.images = postImages
      await post.save()
    } else {
      // Create new post (allow multiple posts per day)
      const today = getTodayDate()
      console.log('Creating post with images:', postImages.length)
      post = await Post.create({
        coupleId: couple._id,
        authorId: user._id,
        date: today,
        content,
        images: postImages,
      })
      console.log('Post created with images:', post.images?.length || 0)
    }

    return NextResponse.json({
      post: {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        date: post.date,
        content: post.content,
        images: post.images,
        starred: post.starred,
        createdAt: post.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Create/Update post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save post' },
      { status: 500 }
    )
  }
}

