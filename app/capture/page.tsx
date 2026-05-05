'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AddContent, AddResult } from '@/components/AddContent'
import { SearchCapture, SearchCaptureResult } from '@/components/SearchCapture'
import { ContentCard } from '@/components/ContentCard'
import { WishlistCard } from '@/components/WishlistCard'
import { WatchCard } from '@/components/WatchCard'
import { BookCard } from '@/components/BookCard'

type CaptureTab = 'url' | 'search'

function CapturePageInner() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const defaultTab: CaptureTab = searchParams.get('q') ? 'search' : 'url'
  const [tab, setTab] = useState<CaptureTab>(defaultTab)
  const [urlResult, setUrlResult] = useState<AddResult | null>(null)
  const [searchResult, setSearchResult] = useState<SearchCaptureResult | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  if (loading || !user) return null

  const urlDestination    = urlResult?.type === 'product' ? 'Wishlist' : 'Library'
  const urlDestinationHref = urlResult?.type === 'product' ? '/wishlist' : '/library'

  function reset() {
    setUrlResult(null)
    setSearchResult(null)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Capture</h1>
        <p className="text-sm text-gray-500">Save articles, videos, products, and things to watch or read.</p>
      </div>

      {!urlResult && !searchResult && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
          <button
            onClick={() => setTab('url')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'url' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            URL
          </button>
          <button
            onClick={() => setTab('search')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'search' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Search
          </button>
        </div>
      )}

      {!urlResult && !searchResult && tab === 'url' && (
        <AddContent
          onAdded={setUrlResult}
          session={session}
          placeholder="Paste a URL…"
        />
      )}

      {!urlResult && !searchResult && tab === 'search' && (
        <SearchCapture
          onAdded={setSearchResult}
          session={session}
        />
      )}

      {urlResult && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <span>✓</span>
            <span>
              Saved to your{' '}
              <a href={urlDestinationHref} className="underline">{urlDestination}</a>
            </span>
          </div>

          {urlResult.type === 'content' ? (
            <ContentCard item={urlResult.item} />
          ) : (
            <WishlistCard item={urlResult.item} />
          )}

          <button
            onClick={reset}
            className="w-full py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Save another
          </button>
        </div>
      )}

      {searchResult && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <span>✓</span>
            <span>
              Saved to your{' '}
              <a href="/watchlist" className="underline">Watchlist</a>
            </span>
          </div>

          {searchResult.type === 'book' && searchResult.hardcover && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${searchResult.hardcover.success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <span>{searchResult.hardcover.success ? '✓ Added to Hardcover "Want to Read"' : `Hardcover: ${searchResult.hardcover.error}`}</span>
            </div>
          )}

          {searchResult.type === 'watch' ? (
            <WatchCard item={searchResult.item} />
          ) : (
            <BookCard item={searchResult.item} />
          )}

          <button
            onClick={reset}
            className="w-full py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Save another
          </button>
        </div>
      )}
    </div>
  )
}

export default function CapturePage() {
  return (
    <Suspense fallback={null}>
      <CapturePageInner />
    </Suspense>
  )
}
