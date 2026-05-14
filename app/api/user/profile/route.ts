import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'

export async function GET() {
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

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        gender: user.gender || null,
        height: user.height || null,
        weight: user.weight || null,
        measurements: user.measurements || null,
        shoeSize: user.shoeSize || null,
        clothingSize: user.clothingSize || null,
        ringSize: user.ringSize || null,
        personalNote: user.personalNote || null,
      },
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, email, gender, image,
      height, weight, measurements,
      shoeSize, clothingSize, ringSize, personalNote
    } = await req.json()

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existing = await User.findOne({ email })
      if (existing && existing._id.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: 'Email này đã được sử dụng bởi tài khoản khác' },
          { status: 400 }
        )
      }
      user.email = email
    }

    if (name && name.trim()) {
      user.name = name.trim()
    }
    if (gender !== undefined) user.gender = gender
    if (image !== undefined) user.image = image
    if (height !== undefined) user.height = height
    if (weight !== undefined) user.weight = weight
    if (measurements !== undefined) user.measurements = measurements
    if (shoeSize !== undefined) user.shoeSize = shoeSize
    if (clothingSize !== undefined) user.clothingSize = clothingSize
    if (ringSize !== undefined) user.ringSize = ringSize
    if (personalNote !== undefined) user.personalNote = personalNote

    await user.save()

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        gender: user.gender || null,
        height: user.height || null,
        weight: user.weight || null,
        measurements: user.measurements || null,
        shoeSize: user.shoeSize || null,
        clothingSize: user.clothingSize || null,
        ringSize: user.ringSize || null,
        personalNote: user.personalNote || null,
      },
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}

