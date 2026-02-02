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
      // Thử gọi trực tiếp REST API để xem raw response (debug)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
      const formData = new FormData()
      formData.append('file', dataUrl)
      formData.append('folder', 'my-love-app')

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const responseText = await uploadRes.text()
      console.error('Cloudinary REST API raw response:', {
        status: uploadRes.status,
        statusText: uploadRes.statusText,
        contentType: uploadRes.headers.get('content-type'),
        sample: responseText.slice(0, 500),
      })

      if (!uploadRes.ok) {
        return NextResponse.json(
          {
            error: `Cloudinary upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
            detail: responseText.slice(0, 500),
          },
          { status: uploadRes.status }
        )
      }

      try {
        const uploadData = JSON.parse(responseText)
        return NextResponse.json({
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
        })
      } catch {
        return NextResponse.json(
          {
            error: 'Cloudinary returned non-JSON response',
            detail: responseText.slice(0, 500),
          },
          { status: 502 }
        )
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      return NextResponse.json(
        {
          error: err?.message ?? 'Upload Cloudinary thất bại',
          detail: err?.stack?.slice(0, 300) ?? null,
        },
        { status: 500 }
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
