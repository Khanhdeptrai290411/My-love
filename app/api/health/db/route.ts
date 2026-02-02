import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health/db
 * Kiểm tra kết nối MongoDB (dùng để test sau khi đổi env trên Vercel).
 * Vercel: dùng DB name không có dấu - (ví dụ my_love thay vì my-love).
 */
export async function GET() {
  try {
    await connectDB()
    const state = mongoose.connection.readyState
    const ok = state === 1
    return NextResponse.json({
      ok,
      db: ok ? 'connected' : ['disconnected', 'connecting', 'connected', 'disconnecting'][state] ?? state,
    })
  } catch (error: any) {
    console.error('Health DB error:', error?.message)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Connection failed' },
      { status: 500 }
    )
  }
}
