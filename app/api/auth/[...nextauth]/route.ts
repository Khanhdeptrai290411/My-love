import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest, context: any) {
  try {
    return await handler(req as any, context)
  } catch (error: any) {
    console.error('NextAuth GET error:', error)
    return NextResponse.json(
      { error: 'Authentication error', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    return await handler(req as any, context)
  } catch (error: any) {
    console.error('NextAuth POST error:', error)
    return NextResponse.json(
      { error: 'Authentication error', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

