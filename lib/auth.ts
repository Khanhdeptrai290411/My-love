import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import connectDB from './mongodb'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    // Chỉ enable Google Provider nếu có credentials
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          await connectDB()
          const user = await User.findOne({ email: credentials.email })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error: any) {
          console.error('Authorization error:', error)
          // Return null instead of throwing to prevent HTTP2 protocol error
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // IMPORTANT:
      // With `session.strategy = 'jwt'`, the token is stored in a cookie.
      // Never store large payloads (e.g. base64 images) in the token, or HTTP requests can fail.
      if (user) {
        // Keep token small and stable
        token.sub = (user as any).id || token.sub
        token.email = user.email
        token.name = user.name

        const img = (user as any).image as unknown
        if (typeof img === 'string') {
          // Only allow URL-ish images in token; strip base64/data URIs
          if (img.startsWith('data:')) {
            delete (token as any).picture
          } else {
            ;(token as any).picture = img
          }
        }
      }
      return token
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google') {
          await connectDB()
          const existingUser = await User.findOne({ email: user.email })
          
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
            })
          }
        }
        return true
      } catch (error: any) {
        console.error('SignIn callback error:', error)
        return false // Prevent sign-in if DB operation fails
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          await connectDB()
          const user = await User.findOne({ email: session.user.email })
          if (user) {
            session.user.id = user._id.toString()
          }
        }
        // Prefer token picture for small/fast UI; DB value might be base64 (large)
        if (session.user && (token as any).picture && typeof (token as any).picture === 'string') {
          session.user.image = (token as any).picture
        }
        return session
      } catch (error: any) {
        console.error('Session callback error:', error)
        return session // Return session even if DB lookup fails
      }
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
}

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Authentication may fail.')
}

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI is not set. Database connection will fail.')
}

