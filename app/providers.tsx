'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import UpcomingEventBackground from '@/components/UpcomingEventBackground'
import ReminderExplosionEffect from '@/components/ReminderExplosionEffect'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <UpcomingEventBackground />
        <ReminderExplosionEffect />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}

