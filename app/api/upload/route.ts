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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary env:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        cloudNameLength: cloudName?.length,
        apiKeyLength: apiKey?.length,
      })
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
      console.error('Cloudinary upload failed:', {
        message: error?.message,
        http_code: error?.http_code,
        name: error?.name,
        cloudName: cloudName,
        apiKeyPrefix: apiKey?.substring(0, 3) + '...',
      })
      return NextResponse.json(
        {
          error:
            'Upload Cloudinary thất bại. Kiểm tra cấu hình CLOUDINARY_* và thử lại. Chi tiết: ' +
            (error?.message || error?.http_code || 'Unknown error'),
        },
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
