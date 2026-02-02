import { NextResponse } from 'next/server'

// Đảm bảo dùng Node.js runtime để gọi Cloudinary
export const runtime = 'nodejs'

export async function GET() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET

  if (!cloud || !key || !secret) {
    return NextResponse.json(
      { error: 'Thiếu CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET' },
      { status: 500 }
    )
  }

  try {
    const auth = Buffer.from(`${key}:${secret}`).toString('base64')
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: 'no-store',
    })

    const text = await res.text()

    return NextResponse.json({
      status: res.status,
      contentType: res.headers.get('content-type'),
      sample: text.slice(0, 200),
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Ping Cloudinary thất bại' },
      { status: 500 }
    )
  }
}

