'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function NavUser() {
  const { user, loading } = useAuth()

  if (loading || !user) return null

  return (
    <Link
      href="/settings"
      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      Settings
    </Link>
  )
}
