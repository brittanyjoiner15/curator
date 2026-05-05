'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { ContentItem, WishlistItem } from '@/types'

export type AddResult =
  | { type: 'content'; item: ContentItem }
  | { type: 'product'; item: WishlistItem }

function AddContentInner({
  onAdded,
  session,
  placeholder = 'Paste a URL…',
}: {
  onAdded: (result: AddResult) => void
  session: Session | null
  placeholder?: string
}) {
  const searchParams = useSearchParams()
  const [url, setUrl] = useState(searchParams.get('link') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || !session) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      onAdded(data as AddResult)
      setUrl('')
    } catch {
      setError('Failed to reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 bg-white"
          required
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Analyzing…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-sm text-red-500 px-1">{error}</p>}
    </form>
  )
}

export function AddContent(props: {
  onAdded: (result: AddResult) => void
  session: Session | null
  placeholder?: string
}) {
  return (
    <Suspense fallback={null}>
      <AddContentInner {...props} />
    </Suspense>
  )
}
