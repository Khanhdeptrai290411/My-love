import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// BẮT BUỘC chạy Node.js runtime (Cloudinary SDK không hỗ trợ Edge runtime)
export const runtime = 'nodejs'

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
      // Thử signed upload trước (không cần preset)
      const { uploadImage, uploadImageUnsigned, uploadImageDirectREST } = await import('@/lib/cloudinary')
      let result
      try {
        result = await uploadImage(file)
      } catch (signedErr: any) {
        // Nếu signed upload fail, thử unsigned với preset (SDK)
        console.warn('Signed upload failed, trying unsigned (SDK):', {
          error: signedErr?.message,
          http_code: signedErr?.http_code,
        })
        try {
          result = await uploadImageUnsigned(file, 'my_love_unsigned')
        } catch (unsignedErr: any) {
          // Nếu unsigned SDK cũng fail, thử REST API trực tiếp (bypass SDK)
          console.warn('Unsigned SDK upload failed, trying direct REST API:', {
            error: unsignedErr?.message,
            http_code: unsignedErr?.http_code,
          })
          result = await uploadImageDirectREST(file, 'my_love_unsigned')
        }
      }
      return NextResponse.json({
        url: result.url,
        publicId: result.publicId,
      })
    } catch (err: any) {
      console.error('Cloudinary upload error raw:', err)
      console.error('Cloudinary upload error detail:', {
        name: err?.name,
        message: err?.message,
        http_code: err?.http_code,
        statusCode: err?.statusCode,
        error: err?.error,
        stack: err?.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      })
      return NextResponse.json(
        {
          error: err?.message ?? 'Upload Cloudinary thất bại',
          detail: err?.error ?? null,
          http_code: err?.http_code ?? err?.statusCode ?? null,
        },
        { status: err?.http_code ?? err?.statusCode ?? 502 }
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
