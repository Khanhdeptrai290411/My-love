'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Menu, X, LogOut, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleFixIndex = async () => {
    try {
      const res = await fetch('/api/admin/drop-index', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Đã sửa lỗi duplicate key! Bây giờ bạn có thể đăng bài bình thường.')
      } else {
        toast.error(data.error || 'Lỗi khi sửa index')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi kết nối máy chủ')
    }
  }

  const navLinks = [
    { href: '/home', label: 'Trang chủ' },
    { href: '/chat', label: 'Chat' },
    { href: '/review', label: 'Review' },
    { href: '/stars', label: 'Khoảnh khắc' },
    { href: '/anniversary', label: 'Kỷ niệm' },
    { href: '/cycle', label: 'Chu kỳ' },
    { href: '/settings', label: 'Cài đặt' },
  ]

  const handleNavClick = () => {
    setIsMobileOpen(false)
  }

  return (
    <nav className="bg-[#fff5f8]/95 dark:bg-[#120c15]/95 backdrop-blur-2xl sticky top-0 z-50 mb-6 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/home"
              className="flex items-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
              onClick={handleNavClick}
            >
              MyLove
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  pathname === link.href
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 transform hover:scale-105'
                    : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: theme toggle + user + mobile button */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {mounted && (
              <button
                onClick={handleFixIndex}
                className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition-colors"
                title="Sửa lỗi duplicate key"
                aria-label="Fix duplicate key error"
              >
                <Wrench size={20} />
              </button>
            )}
            
            {session?.user && (
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 rounded-full text-foreground/70 hover:bg-secondary hover:text-primary transition-colors"
                  aria-label="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-secondary focus:outline-none md:hidden transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen((prev) => !prev)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className={`${isMobileOpen ? 'block' : 'hidden'} md:hidden bg-[#fff5f8]/95 dark:bg-[#120c15]/95 backdrop-blur-2xl border-t border-border shadow-2xl absolute w-full`}
        id="mobile-menu"
      >
        <div className="px-4 pt-4 pb-6 space-y-2">
          {session?.user && (
            <div className="px-4 py-3 flex items-center justify-between glass-card mb-4 border border-border">
              <span className="text-sm font-semibold max-w-[160px] truncate">
                {session.user.name}
              </span>
              <button
                onClick={() => {
                  setIsMobileOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="text-sm font-semibold text-primary flex items-center gap-1 hover:text-accent transition-colors"
              >
                <LogOut size={16} /> Thoát
              </button>
            </div>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              onClick={handleNavClick}
              className={`block px-4 py-3 rounded-2xl text-base font-semibold transition-all ${
                pathname === link.href
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground/80 hover:bg-secondary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

