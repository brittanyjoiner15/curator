'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { Session } from '@supabase/supabase-js'
import { WatchItem, BookItem } from '@/types'

type SearchTab = 'watch' | 'books'

export type SearchResult =
  | { kind: 'watch'; id: number; media_type: 'movie' | 'tv'; title: string; overview: string; poster_url: string | null; release_year: number | null; streaming_services: string[] }
  | { kind: 'book'; id: string; title: string; authors: string[]; description: string; cover_url: string | null; published_year: number | null; isbn_13: string | null; isbn_10: string | null; page_count: number | null }

export type SearchCaptureResult =
  | { type: 'watch'; item: WatchItem }
  | { type: 'book'; item: BookItem }

function SearchCaptureInner({
  onAdded,
  session,
}: {
  onAdded: (result: SearchCaptureResult) => void
  session: Session | null
}) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<SearchTab>('watch')
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setResults([])
    setSelected(null)
  }, [tab])

  useEffect(() => {
    if (!query.trim() || !session) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const endpoint = tab === 'watch'
          ? `/api/watch/search?q=${encodeURIComponent(query.trim())}`
          : `/api/books/search?q=${encodeURIComponent(query.trim())}`

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (Array.isArray(data)) {
          setResults(
            data.map((r: any) =>
              tab === 'watch'
                ? { kind: 'watch' as const, ...r }
                : { kind: 'book' as const, ...r }
            )
          )
        }
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, tab, session])

  async function handleSave() {
    if (!selected || !session) return
    setSaving(true)
    setError(null)
    try {
      let res: Response
      if (selected.kind === 'watch') {
        res = await fetch('/api/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            tmdb_id: selected.id,
            media_type: selected.media_type,
            title: selected.title,
            overview: selected.overview,
            poster_url: selected.poster_url,
            release_year: selected.release_year,
            streaming_services: selected.streaming_services,
          }),
        })
      } else {
        res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            google_books_id: selected.id,
            title: selected.title,
            authors: selected.authors,
            description: selected.description,
            cover_url: selected.cover_url,
            published_year: selected.published_year,
            isbn_13: selected.isbn_13,
            isbn_10: selected.isbn_10,
            page_count: selected.page_count,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save')
        return
      }

      onAdded(
        selected.kind === 'watch'
          ? { type: 'watch', item: data as WatchItem }
          : { type: 'book', item: data as BookItem }
      )
      setQuery('')
      setResults([])
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  const posterUrl = selected && (selected.kind === 'watch' ? selected.poster_url : selected.cover_url)
  const posterAlt = selected?.title ?? ''

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to results
        </button>

        <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
          {posterUrl ? (
            <div className="relative shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ width: 64, height: 92 }}>
              <Image src={posterUrl} alt={posterAlt} fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-3xl" style={{ width: 64, height: 92 }}>
              {selected.kind === 'watch' ? '🎬' : '📖'}
            </div>
          )}

          <div className="flex flex-col gap-2 min-w-0">
            <div>
              <p className="font-semibold text-gray-900">{selected.title}</p>
              {selected.kind === 'watch' ? (
                <p className="text-xs text-gray-400">
                  {selected.media_type === 'tv' ? 'TV Show' : 'Movie'}
                  {selected.release_year ? ` · ${selected.release_year}` : ''}
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  {selected.authors.join(', ')}
                  {selected.published_year ? ` · ${selected.published_year}` : ''}
                </p>
              )}
            </div>

            {selected.kind === 'watch' && selected.overview && (
              <p className="text-xs text-gray-500 line-clamp-3">{selected.overview}</p>
            )}
            {selected.kind === 'book' && selected.description && (
              <p className="text-xs text-gray-500 line-clamp-3">{selected.description}</p>
            )}

            {selected.kind === 'watch' && selected.streaming_services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.streaming_services.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            )}
            {selected.kind === 'book' && (selected.isbn_13 || selected.isbn_10) && (
              <p className="text-xs text-gray-400">ISBN: {selected.isbn_13 ?? selected.isbn_10}</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : selected.kind === 'watch' ? 'Add to Watchlist' : 'Add to Reading List'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
        <button
          onClick={() => setTab('watch')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'watch' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Movies & TV
        </button>
        <button
          onClick={() => setTab('books')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'books' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Books
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          placeholder={tab === 'watch' ? 'Search for a movie or TV show…' : 'Search for a book…'}
          className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map(r => {
            const imgUrl = r.kind === 'watch' ? r.poster_url : r.cover_url
            const subtitle = r.kind === 'watch'
              ? `${r.media_type === 'tv' ? 'TV Show' : 'Movie'}${r.release_year ? ` · ${r.release_year}` : ''}`
              : `${r.authors.join(', ')}${r.published_year ? ` · ${r.published_year}` : ''}`
            const subtext = r.kind === 'watch' && r.streaming_services.length > 0
              ? r.streaming_services.slice(0, 2).join(', ') + (r.streaming_services.length > 2 ? ` +${r.streaming_services.length - 2}` : '')
              : r.kind === 'book' && (r.isbn_13 || r.isbn_10)
                ? `ISBN: ${r.isbn_13 ?? r.isbn_10}`
                : null

            return (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => setSelected(r)}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
              >
                {imgUrl ? (
                  <div className="relative shrink-0 rounded-md overflow-hidden bg-gray-100" style={{ width: 40, height: 56 }}>
                    <Image src={imgUrl} alt={r.title} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-lg" style={{ width: 40, height: 56 }}>
                    {r.kind === 'watch' ? '🎬' : '📖'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                  {subtext && <p className="text-xs text-violet-600 mt-0.5 truncate">{subtext}</p>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No results found.</p>
      )}
    </div>
  )
}

export function SearchCapture(props: {
  onAdded: (result: SearchCaptureResult) => void
  session: Session | null
}) {
  return (
    <Suspense fallback={null}>
      <SearchCaptureInner {...props} />
    </Suspense>
  )
}
