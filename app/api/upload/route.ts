import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 5MB for base64)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn (tối đa 5MB)' }, { status: 400 })
    }

    // Check if Cloudinary is configured
    const hasCloudinary = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET

    if (hasCloudinary) {
      try {
        // Try Cloudinary upload
        const { uploadImage } = await import('@/lib/cloudinary')
        const result = await uploadImage(file)
        return NextResponse.json({
          url: result.url,
          publicId: result.publicId,
        })
      } catch (error: any) {
        console.error('Cloudinary upload failed, falling back to base64:', error)
        // Fall through to base64
      }
    }

    // Fallback to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      publicId: undefined, // No publicId for base64
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
