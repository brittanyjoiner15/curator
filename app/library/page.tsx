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
  const [showRead, setShowRead] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

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

  async function handleDelete(id: string) {
    if (!session) return
    const res = await fetch(`/api/content/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleToggleRead(id: string, read: boolean) {
    if (!session) return
    const res = await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ read }),
    })
    if (res.ok) setItems(prev => prev.map(i => i.id === id ? { ...i, read } : i))
  }

  if (loading || !user) return null

  const allTopics = [...new Set(items.flatMap(i => i.topics))].sort()

  function toggleTopic(topic: string) {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const filtered = items
    .filter(i => i.read === showRead)
    .filter(i => selectedTopics.length === 0 || selectedTopics.some(t => i.topics.includes(t)))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Your library</h1>
        <p className="text-sm text-gray-500">Paste a YouTube or article URL to save it.</p>
      </div>

      <AddContent onAdded={handleAdded} session={session} />

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 self-start">
        <button
          onClick={() => setShowRead(false)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showRead ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Unread
        </button>
        <button
          onClick={() => setShowRead(true)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${showRead ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Read
        </button>
      </div>

      {!itemsLoading && allTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTopics.map(topic => {
            const active = selectedTopics.includes(topic)
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  active
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-violet-400 hover:text-violet-600'
                }`}
              >
                {topic}
              </button>
            )
          })}
        </div>
      )}

      {itemsLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">{showRead ? '✓' : '📚'}</p>
          <p className="text-sm">{showRead ? 'Nothing marked as read yet.' : 'Nothing saved yet. Add something above!'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onToggleRead={handleToggleRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}
