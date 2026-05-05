'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ContentCard, TopicBadge } from '@/components/ContentCard'
import { ContentItem } from '@/types'

const TIME_PRESETS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
]

export default function BrowsePage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [maxMinutes, setMaxMinutes] = useState(30)
  const [suggestion, setSuggestion] = useState<ContentItem | null | undefined>(undefined)
  const [fetching, setFetching] = useState(false)
  const [noMatch, setNoMatch] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/topics', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTopics(data) })
  }, [session])

  function toggleTopic(topic: string) {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
    setSuggestion(undefined)
    setNoMatch(false)
  }

  async function handleSurpriseMe() {
    if (!session) return
    setFetching(true)
    setSuggestion(undefined)
    setNoMatch(false)

    const params = new URLSearchParams({ max_minutes: String(maxMinutes) })
    if (selectedTopics.length) params.set('topics', selectedTopics.join(','))

    try {
      const res = await fetch(`/api/suggest?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.item) setSuggestion(data.item)
      else setNoMatch(true)
    } catch {
      setNoMatch(true)
    } finally {
      setFetching(false)
    }
  }

  if (loading || !user) return null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Surprise me</h1>
        <p className="text-sm text-gray-500">Tell me how much time you have and what you're in the mood for.</p>
      </div>

      {/* Time selector */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">How much time do you have?</p>
        <div className="flex flex-wrap gap-2">
          {TIME_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => { setMaxMinutes(preset.value); setSuggestion(undefined); setNoMatch(false) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                maxMinutes === preset.value
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic selector */}
      {topics.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            What are you in the mood for?{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`transition-all rounded-full ${
                  selectedTopics.includes(topic) ? 'ring-2 ring-violet-400 ring-offset-1 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <TopicBadge topic={topic} />
              </button>
            ))}
          </div>
          {selectedTopics.length > 0 && (
            <button
              onClick={() => { setSelectedTopics([]); setSuggestion(undefined); setNoMatch(false) }}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleSurpriseMe}
        disabled={fetching}
        className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-base"
      >
        {fetching ? 'Finding something…' : '✨ Surprise me'}
      </button>

      {noMatch && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">🤷</p>
          <p className="text-sm">Nothing matched. Try different topics or more time.</p>
        </div>
      )}

      {suggestion && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-500 text-center">Here's something for you →</p>
          <ContentCard
            item={suggestion}
            large
            onDelete={async (id) => {
              await fetch(`/api/content/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session!.access_token}` },
              })
              setSuggestion(undefined)
            }}
            onToggleRead={async (id, read) => {
              await fetch(`/api/content/${id}`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${session!.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ read }),
              })
              setSuggestion(prev => prev ? { ...prev, read } : prev)
            }}
          />
          <button
            onClick={handleSurpriseMe}
            className="w-full py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Try another
          </button>
        </div>
      )}
    </div>
  )
}
