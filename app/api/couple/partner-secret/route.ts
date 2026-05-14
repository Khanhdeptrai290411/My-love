import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Couple } from '@/models/Couple'
import { User } from '@/models/User'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    const couple = await Couple.findOne({ memberIds: user._id })
    if (!couple || couple.memberIds.length < 2) {
      return NextResponse.json({ error: 'Chưa có đối tác' }, { status: 400 })
    }

    const partnerId = couple.memberIds.find((id: any) => id.toString() !== user._id.toString())
    const partner = await User.findById(partnerId)
    if (!partner) return NextResponse.json({ error: 'Không tìm thấy đối tác' }, { status: 404 })

    const data = await req.json()
    
    if (data.height !== undefined) partner.height = data.height
    if (data.weight !== undefined) partner.weight = data.weight
    if (data.shoeSize !== undefined) partner.shoeSize = data.shoeSize
    if (data.clothingSize !== undefined) partner.clothingSize = data.clothingSize
    if (data.ringSize !== undefined) partner.ringSize = data.ringSize
    if (data.measurements !== undefined) partner.measurements = data.measurements

    await partner.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
