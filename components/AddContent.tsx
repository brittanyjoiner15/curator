'use client'

import { useState } from 'react'
import { ContentItem } from '@/types'

export function AddContent({ onAdded }: { onAdded: (item: ContentItem) => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      onAdded(data)
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
          placeholder="Paste a YouTube or article URL…"
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
