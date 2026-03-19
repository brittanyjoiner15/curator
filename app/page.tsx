'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AddContent } from '@/components/AddContent'
import { ContentCard } from '@/components/ContentCard'
import { ContentItem } from '@/types'

export default function LibraryPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ContentItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/content', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data) })
      .finally(() => setItemsLoading(false))
  }, [session])

  function handleAdded(item: ContentItem) {
    setItems(prev => [item, ...prev])
  }

  if (loading) return null
  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Your library</h1>
        <p className="text-sm text-gray-500">Paste a YouTube or article URL to save it.</p>
      </div>

      <AddContent onAdded={handleAdded} session={session} />

      {itemsLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">Nothing saved yet. Add something above!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
