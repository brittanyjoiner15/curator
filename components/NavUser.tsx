'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function NavUser() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/auth"
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth?mode=signup"
          className="px-3 py-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          Get started
        </Link>
      </div>
    )
  }

  return (
    <Link
      href="/settings"
      aria-label="Settings"
      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
    </Link>
  )
}
