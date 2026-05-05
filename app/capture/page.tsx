'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AddContent, AddResult } from '@/components/AddContent'
import { ContentCard } from '@/components/ContentCard'
import { WishlistCard } from '@/components/WishlistCard'

export default function CapturePage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [result, setResult] = useState<AddResult | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  if (loading || !user) return null

  const destination = result?.type === 'product' ? 'Wishlist' : 'Library'
  const destinationHref = result?.type === 'product' ? '/wishlist' : '/library'

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Capture</h1>
        <p className="text-sm text-gray-500">Paste anything — article, video, or product. We'll figure out where it goes.</p>
      </div>

      {!result ? (
        <AddContent
          onAdded={setResult}
          session={session}
          placeholder="Paste a URL…"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <span>✓</span>
            <span>
              Saved to your{' '}
              <a href={destinationHref} className="underline">
                {destination}
              </a>
            </span>
          </div>

          {result.type === 'content' ? (
            <ContentCard item={result.item} />
          ) : (
            <WishlistCard item={result.item} />
          )}

          <button
            onClick={() => setResult(null)}
            className="w-full py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Save another
          </button>
        </div>
      )}
    </div>
  )
}
