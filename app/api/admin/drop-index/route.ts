import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not available')
    }
    const collection = db.collection('posts')

    try {
      // Drop the unique index
      await collection.dropIndex('authorId_1_date_1')
      return NextResponse.json({ 
        success: true, 
        message: 'Đã xóa unique index thành công! Bây giờ bạn có thể đăng nhiều post trong 1 ngày.' 
      })
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        return NextResponse.json({ 
          success: true, 
          message: 'Index không tồn tại (đã được xóa rồi hoặc chưa từng được tạo)' 
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Drop index error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to drop index' },
      { status: 500 }
    )
  }
}

