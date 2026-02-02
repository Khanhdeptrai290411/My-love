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

    // Bắt buộc Cloudinary cho mọi môi trường (không dùng base64 nữa)
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET

    if (!hasCloudinary) {
      return NextResponse.json(
        { error: 'Cloudinary chưa được cấu hình (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).' },
        { status: 500 }
      )
    }

    try {
      const { uploadImage } = await import('@/lib/cloudinary')
      const result = await uploadImage(file)
      return NextResponse.json({
        url: result.url,
        publicId: result.publicId,
      })
    } catch (error: any) {
      console.error('Cloudinary upload failed:', error)
      return NextResponse.json(
        { error: 'Upload Cloudinary thất bại. Kiểm tra cấu hình CLOUDINARY_* và thử lại.' },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
