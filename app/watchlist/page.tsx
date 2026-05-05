'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { WatchCard } from '@/components/WatchCard'
import { BookCard } from '@/components/BookCard'
import { WatchItem, BookItem } from '@/types'

type TopTab = 'watch' | 'books'

export default function WatchlistPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [topTab, setTopTab] = useState<TopTab>('watch')

  const [watchItems, setWatchItems] = useState<WatchItem[]>([])
  const [watchTab, setWatchTab] = useState<'to-watch' | 'watched'>('to-watch')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [watchFetching, setWatchFetching] = useState(true)

  const [bookItems, setBookItems] = useState<BookItem[]>([])
  const [bookTab, setBookTab] = useState<'to-read' | 'read'>('to-read')
  const [bookFetching, setBookFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/watch', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setWatchItems(data) })
      .finally(() => setWatchFetching(false))
  }, [session])

  useEffect(() => {
    if (!session) return
    fetch('/api/books', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBookItems(data) })
      .finally(() => setBookFetching(false))
  }, [session])

  async function handleDeleteWatch(id: string) {
    if (!session) return
    setWatchItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/watch/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } })
  }

  async function handleToggleWatched(id: string, watched: boolean) {
    if (!session) return
    setWatchItems(prev => prev.map(i => i.id === id ? { ...i, watched } : i))
    await fetch(`/api/watch/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ watched }),
    })
  }

  async function handleDeleteBook(id: string) {
    if (!session) return
    setBookItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/books/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } })
  }

  async function handleToggleRead(id: string, read: boolean) {
    if (!session) return
    setBookItems(prev => prev.map(i => i.id === id ? { ...i, read } : i))
    await fetch(`/api/books/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    })
  }

  const filteredWatch = watchItems
    .filter(i => watchTab === 'watched' ? i.watched : !i.watched)
    .filter(i => typeFilter === 'all' || i.media_type === typeFilter)

  const filteredBooks = bookItems.filter(i => bookTab === 'read' ? i.read : !i.read)

  if (loading || !user) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Watchlist</h1>
        <p className="text-sm text-gray-500">Movies, TV shows, and books.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
        <button
          onClick={() => setTopTab('watch')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${topTab === 'watch' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Movies & TV
        </button>
        <button
          onClick={() => setTopTab('books')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${topTab === 'books' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Books
        </button>
      </div>

      {topTab === 'watch' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-1 border-b border-gray-100">
              {(['to-watch', 'watched'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setWatchTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    watchTab === t ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'to-watch' ? 'To watch' : 'Watched'}
                  <span className="ml-1.5 text-xs text-gray-400">
                    {watchItems.filter(i => t === 'watched' ? i.watched : !i.watched).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['all', 'movie', 'tv'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === f ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Shows'}
                </button>
              ))}
            </div>
          </div>

          {watchFetching ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredWatch.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">{watchTab === 'watched' ? '🎬' : '🍿'}</p>
              <p className="text-sm">
                {watchTab === 'watched'
                  ? 'Nothing watched yet.'
                  : typeFilter !== 'all'
                    ? `No ${typeFilter === 'movie' ? 'movies' : 'TV shows'} in your list.`
                    : 'Use Capture to add movies and TV shows.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredWatch.map(item => (
                <WatchCard key={item.id} item={item} onDelete={handleDeleteWatch} onToggleWatched={handleToggleWatched} />
              ))}
            </div>
          )}
        </div>
      )}

      {topTab === 'books' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 border-b border-gray-100">
            {(['to-read', 'read'] as const).map(t => (
              <button
                key={t}
                onClick={() => setBookTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  bookTab === t ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'to-read' ? 'To read' : 'Read'}
                <span className="ml-1.5 text-xs text-gray-400">
                  {bookItems.filter(i => t === 'read' ? i.read : !i.read).length}
                </span>
              </button>
            ))}
          </div>

          {bookFetching ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">{bookTab === 'read' ? '📚' : '📖'}</p>
              <p className="text-sm">
                {bookTab === 'read' ? 'Nothing read yet.' : 'Use Capture to add books.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBooks.map(item => (
                <BookCard key={item.id} item={item} onDelete={handleDeleteBook} onToggleRead={handleToggleRead} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
