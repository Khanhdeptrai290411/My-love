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
    const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())
    let authorFilter: any = {}
    
    console.log('=== POST FILTER DEBUG ===')
    console.log('Filter:', filter)
    console.log('User ID:', user._id.toString())
    console.log('All member IDs:', couple.memberIds.map((id: any) => id.toString()))
    console.log('Partner ID:', partnerId?.toString())
    console.log('Start date:', startDate)
    
    if (filter === 'me') {
      authorFilter.authorId = user._id
    } else if (filter === 'partner') {
      if (!partnerId) {
        console.log('❌ No partner found - returning empty array')
        return NextResponse.json({ posts: [] })
      }
      authorFilter.authorId = partnerId
      console.log('✅ Using partner filter with ID:', partnerId.toString())
    }
    // If filter === 'both', don't add authorFilter (show all)
    
    console.log('Author filter:', JSON.stringify(authorFilter, null, 2))

    const query: any = {
      coupleId: couple._id,
      date: { $gte: startDate },
      ...authorFilter,
    }
    
    console.log('Final query:', JSON.stringify({
      coupleId: query.coupleId.toString(),
      date: query.date,
      authorId: query.authorId?.toString(),
    }, null, 2))

    const posts = await Post.find(query)
      .populate('authorId', 'name email image')
      .sort({ date: -1, createdAt: -1 })
    
    console.log(`✅ Found ${posts.length} posts for filter: ${filter}`)
    if (posts.length > 0) {
      console.log('Post authors:', posts.map((p: any) => ({
        id: p.authorId.toString(),
        name: (p.authorId as any).name,
      })))
    }
    console.log('=== END DEBUG ===')

    return NextResponse.json({
      posts: posts.map(p => {
        // Ensure images array is properly formatted
        const postImages = Array.isArray(p.images) ? p.images : []
        return {
          id: p._id.toString(),
          authorId: p.authorId.toString(),
          author: {
            name: (p.authorId as any).name,
            email: (p.authorId as any).email,
            image: (p.authorId as any).image,
          },
          date: p.date,
          content: p.content,
          images: postImages,
          starred: p.starred,
          createdAt: p.createdAt,
        }
      }),
    })
  } catch (error: any) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get posts' },
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

