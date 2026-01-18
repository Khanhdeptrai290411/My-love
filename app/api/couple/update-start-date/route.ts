import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'
import { generateInviteCodeFromDate } from '@/lib/utils'
import mongoose from 'mongoose'

export async function PATCH(req: NextRequest) {
  try {
    console.log('=== UPDATE START DATE API CALLED ===')
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { startDate } = body
    console.log('📥 Received startDate:', startDate)
    
    if (!startDate) {
      console.log('❌ Start date required')
      return NextResponse.json({ error: 'Start date required' }, { status: 400 })
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Validate date is not in the future
    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (start > today) {
      return NextResponse.json({ error: 'Ngày hẹn hò không thể là ngày tương lai' }, { status: 400 })
    }

    await connectDB()
    console.log('✅ Connected to DB')
    
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log('✅ User found:', user._id.toString())

    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple) {
      console.log('❌ Couple not found')
      return NextResponse.json({ error: 'No couple found' }, { status: 404 })
    }
    console.log('✅ Couple found:', couple._id.toString())
    console.log('📋 Current startDate:', couple.startDate)
    console.log('📋 Current inviteCode:', couple.inviteCode)

    // Check if user is the first member (creator)
    const isCreator = couple.memberIds[0].toString() === user._id.toString()
    console.log('👤 Is creator:', isCreator, 'First member:', couple.memberIds[0].toString(), 'Current user:', user._id.toString())
    if (!isCreator) {
      console.log('❌ Not creator, cannot update')
      return NextResponse.json({ error: 'Chỉ người tạo couple mới được sửa ngày hẹn hò' }, { status: 403 })
    }

    // Generate new invite code
    const newInviteCode = generateInviteCodeFromDate(startDate)
    console.log('🔑 Generated new invite code:', newInviteCode)
    console.log('📅 Will update startDate to:', startDate)
    
    // Use raw MongoDB collection to bypass Mongoose issues
    console.log('💾 Using raw MongoDB collection...')
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not available')
    }
    
    // Mongoose converts model name to lowercase plural: Couple -> couples
    const collection = db.collection('couples')
    console.log('📦 Collection name: couples')
    const coupleObjectId = new mongoose.Types.ObjectId(couple._id)
    
    console.log('💾 Updating document with _id:', coupleObjectId.toString())
    const updateResult = await collection.updateOne(
      { _id: coupleObjectId },
      { 
        $set: { 
          startDate: startDate,
          inviteCode: newInviteCode 
        } 
      }
    )
    console.log('📊 Raw update result:', JSON.stringify({
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      upsertedCount: updateResult.upsertedCount
    }, null, 2))
    
    if (updateResult.matchedCount === 0) {
      console.log('❌ No document matched')
      return NextResponse.json({ error: 'Couple not found for update' }, { status: 404 })
    }
    
    // Verify by querying fresh from raw collection
    const verifyDoc = await collection.findOne({ _id: coupleObjectId })
    console.log('🔍 Raw verification - startDate:', verifyDoc?.startDate, 'inviteCode:', verifyDoc?.inviteCode)
    console.log('🔍 Full raw document:', JSON.stringify(verifyDoc, null, 2))
    
    if (!verifyDoc) {
      console.log('❌ Could not verify update')
      return NextResponse.json({ error: 'Failed to verify update' }, { status: 500 })
    }
    
    // Check if update actually worked
    if (verifyDoc.startDate !== startDate) {
      console.error('❌ Raw update failed! Expected:', startDate, 'Got:', verifyDoc.startDate)
      return NextResponse.json({ 
        error: `Failed to update startDate. Expected: ${startDate}, Got: ${verifyDoc.startDate || 'undefined'}` 
      }, { status: 500 })
    }

    // Get final values from raw collection
    const finalDoc = await collection.findOne({ _id: coupleObjectId })
    const finalStartDate = finalDoc?.startDate || startDate
    const finalInviteCode = finalDoc?.inviteCode || newInviteCode
    
    console.log('✅ Final values from raw collection - startDate:', finalStartDate, 'inviteCode:', finalInviteCode)
    
    console.log('✅ Final values - startDate:', finalStartDate, 'inviteCode:', finalInviteCode)

    return NextResponse.json({
      couple: {
        id: couple._id.toString(),
        inviteCode: finalInviteCode,
        startDate: finalStartDate,
      },
      message: 'Đã cập nhật ngày hẹn hò thành công',
    })
  } catch (error: any) {
    console.error('Update start date error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update start date' },
      { status: 500 }
    )
  }
}

