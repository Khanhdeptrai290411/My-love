import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB, { clearMongoCache, isConnectionError } from '@/lib/mongodb'
import { Post } from '@/models/Post'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { getTodayDate } from '@/lib/utils'
import mongoose from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper to safely convert ObjectId to string
function objectIdToString(obj: any): string {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (obj._id) return String(obj._id)
  if (obj.toString && typeof obj.toString === 'function') {
    try {
      return String(obj.toString())
    } catch {
      return String(obj)
    }
  }
  return String(obj)
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await connectDB()
    } catch (connectError: any) {
      console.error('connectDB failed:', connectError?.message)
      if (isConnectionError(connectError)) {
        clearMongoCache()
        return NextResponse.json(
          {
            error: 'Database connection failed.',
            hint: process.env.NODE_ENV === 'development'
              ? 'Check MONGODB_URI in .env.local and MongoDB Atlas Network Access (allow 0.0.0.0/0 or your IP).'
              : undefined,
          },
          { status: 503 }
        )
      }
      throw connectError
    }

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
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10), 1), 200)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    let startDate = getTodayDate()
    if (range === '3month') {
      const date = new Date()
      date.setMonth(date.getMonth() - 3)
      startDate = date.toISOString().split('T')[0]
    } else if (range === 'month') {
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
      if (mongoose.connection.readyState !== 1) {
        await connectDB()
      }
      posts = await Post.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    } catch (queryError: any) {
      console.error('Error querying posts:', queryError?.message || queryError)
      if (isConnectionError(queryError)) {
        clearMongoCache()
        try {
          await connectDB()
          posts = await Post.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
        } catch (retryError: any) {
          console.error('Retry also failed:', retryError?.message || retryError)
          return NextResponse.json(
            {
              error: 'Database connection failed. Please try again later.',
              hint: process.env.NODE_ENV === 'development'
                ? 'Check MONGODB_URI in .env.local and MongoDB Atlas Network Access.'
                : undefined,
            },
            { status: 503 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to query posts', details: queryError?.message },
          { status: 500 }
        )
      }
    }

    // Get all unique author IDs - handle both ObjectId and string
    const authorIds: string[] = []
    const seenIds = new Set<string>()
    
    for (const p of posts) {
      if (!p.authorId) continue
      const idStr = objectIdToString(p.authorId)
      if (idStr && !seenIds.has(idStr)) {
        authorIds.push(idStr)
        seenIds.add(idStr)
      }
    }
    
    // Fetch all authors at once
    let authorsMap: Record<string, any> = {}
    if (authorIds.length > 0) {
      try {
        // Convert string IDs to ObjectIds
        const authorObjectIds = authorIds
          .map((id: string) => {
            try {
              return new mongoose.Types.ObjectId(id)
            } catch {
              return null
            }
          })
          .filter((id): id is mongoose.Types.ObjectId => id !== null)
        
        if (authorObjectIds.length > 0) {
          const authors = await User.find({ _id: { $in: authorObjectIds } })
            .select('name email image')
            .lean()
          authors.forEach((a: any) => {
            let id = ''
            if (a._id) {
              if (a._id.toString && typeof a._id.toString === 'function') {
                id = a._id.toString()
              } else if (typeof a._id === 'string') {
                id = a._id
              }
            }
            if (id) {
              authorsMap[id] = {
                name: a.name || 'Người dùng',
                email: a.email || '',
                image: a.image || null,
              }
            }
          })
        }
      } catch (authorError: any) {
        console.error('Error fetching authors:', authorError?.message || authorError)
        // Continue with empty authorsMap - will use fallback
      }
    }

    // Convert to plain objects safely
    let postsData: any[] = []
    try {
      postsData = posts.map((p: any) => {
      try {
        // Ensure images is always an array (support legacy: string/object)
        const rawImages = (p as any).images
        const postImages = Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : []
        
        // Get author info from map - handle both ObjectId and string
        const authorId = objectIdToString(p.authorId)
        const author = authorsMap[authorId] || {
          name: 'Người dùng',
          email: '',
          image: null,
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
          }).filter((img: any) => {
            const url = typeof img?.url === 'string' ? img.url.trim() : ''
            return url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')
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
    } catch (mapError: any) {
      console.error('Error mapping posts:', mapError?.message || mapError)
      console.error('Stack:', mapError?.stack)
      // Return empty array if mapping fails
      postsData = []
    }

    const hasMore = posts.length === limit

    try {
      return NextResponse.json({ posts: postsData, hasMore })
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

    const { content, images, postId, date: requestDate } = await req.json()
    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const today = getTodayDate()
    const useDate =
      typeof requestDate === 'string' && dateRegex.test(requestDate)
        ? requestDate
        : today
    
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
      // Create new post (allow multiple posts per day; date can be backdated)
      console.log('Creating post with images:', postImages.length, 'date:', useDate)
      post = await Post.create({
        coupleId: couple._id,
        authorId: user._id,
        date: useDate,
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

