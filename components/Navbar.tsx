'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navLinks = [
    { href: '/home', label: 'Trang chủ' },
    { href: '/chat', label: 'Chat' },
    { href: '/mood', label: 'Mood' },
    { href: '/review', label: 'Review' },
    { href: '/stars', label: 'Khoảnh khắc' },
    { href: '/settings', label: 'Cài đặt' },
  ]

  const handleNavClick = () => {
    setIsMobileOpen(false)
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/home"
              className="flex items-center text-xl font-bold text-pink-500"
              onClick={handleNavClick}
            >
              MyLove
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === link.href
                    ? 'border-pink-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: user + mobile button */}
          <div className="flex items-center">
            {session?.user && (
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-700 max-w-[120px] truncate">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Đăng xuất
                </button>
              </div>
            )}
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 md:hidden ml-2"
              aria-controls="mobile-menu"
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen((prev) => !prev)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className={`${isMobileOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-200 bg-white`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {session?.user && (
            <div className="px-2 py-2 flex items-center justify-between bg-gray-50 rounded-md mb-1">
              <span className="text-sm text-gray-700 max-w-[160px] truncate">
                {session.user.name}
              </span>
              <button
                onClick={() => {
                  setIsMobileOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Đăng xuất
              </button>
            </div>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === link.href
                  ? 'bg-pink-50 text-pink-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
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

