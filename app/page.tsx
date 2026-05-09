import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="glass-card p-10 md:p-14 text-center max-w-lg z-10 mx-4 border border-glass-border">
        <h1 className="text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent drop-shadow-sm">
          My Love
        </h1>
        <p className="text-lg text-foreground/80 mb-10 text-balance leading-relaxed font-medium">
          Nơi lưu giữ tình yêu, viết nhật ký, check-in cảm xúc và chia sẻ mọi khoảnh khắc ngọt ngào nhất của hai ta.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:-translate-y-1 transition-all duration-300"
        >
          Bắt đầu yêu ❤️
        </Link>
      </div>
    </div>
  )
}
