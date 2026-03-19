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
    <div className="flex items-center gap-1">
      <Link
        href="/library"
        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Library
      </Link>
      <Link
        href="/browse"
        className="px-3 py-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
      >
        Surprise me
      </Link>
      <Link
        href="/settings"
        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Settings
      </Link>
    </div>
  )
}
