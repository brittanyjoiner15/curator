'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ContentCard } from '@/components/ContentCard'
import { ContentItem } from '@/types'

const TIME_PRESETS = [
  { label: 'Any',    min: 0,  max: null },
  { label: '< 5m',  min: 0,  max: 5    },
  { label: '5–15m', min: 5,  max: 15   },
  { label: '15–30m',min: 15, max: 30   },
  { label: '30–60m',min: 30, max: 60   },
  { label: '1h+',   min: 60, max: null },
]

export default function LibraryPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ContentItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [showRead, setShowRead] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [topicsOpen, setTopicsOpen] = useState(false)
  const [timePreset, setTimePreset] = useState(0)

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

  const { min, max } = TIME_PRESETS[timePreset]

  const filtered = items
    .filter(i => i.read === showRead)
    .filter(i => selectedTopics.length === 0 || selectedTopics.some(t => i.topics.includes(t)))
    .filter(i => i.duration_minutes >= min && (max === null || i.duration_minutes <= max))

  const activeFilterCount = selectedTopics.length + (timePreset !== 0 ? 1 : 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Your library</h1>
        <p className="text-sm text-gray-500">Your saved articles and videos.</p>
      </div>

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

      {!itemsLoading && (
        <div className="flex flex-col gap-3">
          {/* Time filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 shrink-0">Time</span>
            {TIME_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setTimePreset(i)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                  timePreset === i
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-violet-400 hover:text-violet-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Topics collapsible */}
          {allTopics.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setTopicsOpen(o => !o)}
                className="flex items-center gap-1.5 self-start text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${topicsOpen ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
                Topics
                {selectedTopics.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-semibold">
                    {selectedTopics.length}
                  </span>
                )}
              </button>

              {topicsOpen && (
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
                  {selectedTopics.length > 0 && (
                    <button
                      onClick={() => setSelectedTopics([])}
                      className="px-3 py-1 rounded-full text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
          <p className="text-sm">
            {activeFilterCount > 0
              ? 'Nothing matches these filters.'
              : showRead
                ? 'Nothing marked as read yet.'
                : 'Nothing here yet. Use Capture to save something!'}
          </p>
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
