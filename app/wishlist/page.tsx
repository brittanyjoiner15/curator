'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { WishlistCard, CategoryBadge } from '@/components/WishlistCard'
import { WishlistItem } from '@/types'

export default function WishlistPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<WishlistItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState<'to-buy' | 'purchased'>('to-buy')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied'>('idle')

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/wishlist', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data) })
      .finally(() => setFetching(false))
  }, [session])

  async function handleShare() {
    if (!session || shareState === 'loading') return
    setShareState('loading')
    try {
      const res = await fetch('/api/wishlist/share', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const { token } = await res.json()
      const url = `${window.location.origin}/share/${token}`

      if (navigator.share) {
        await navigator.share({ title: 'My Wishlist', url })
        setShareState('idle')
      } else {
        await navigator.clipboard.writeText(url)
        setShareState('copied')
        setTimeout(() => setShareState('idle'), 2500)
      }
    } catch {
      setShareState('idle')
    }
  }

  async function handleDelete(id: string) {
    if (!session) return
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/wishlist/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  }

  async function handleTogglePurchased(id: string, purchased: boolean) {
    if (!session) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased } : i))
    await fetch(`/api/wishlist/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purchased }),
    })
  }

  const filtered = items
    .filter(i => tab === 'purchased' ? i.purchased : !i.purchased)
    .filter(i => !selectedCategory || i.category === selectedCategory)

  const usedCategories = [...new Set(items.map(i => i.category))]

  if (loading || !user) return null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Wishlist</h1>
          <p className="text-sm text-gray-500">Products you want to remember.</p>
        </div>
        <button
          onClick={handleShare}
          disabled={shareState === 'loading'}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {shareState === 'copied' ? (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
              </svg>
              {shareState === 'loading' ? 'Getting link…' : 'Share'}
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-1 border-b border-gray-100">
          {(['to-buy', 'purchased'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'to-buy' ? 'To buy' : 'Purchased'}
              <span className="ml-1.5 text-xs text-gray-400">
                {items.filter(i => t === 'purchased' ? i.purchased : !i.purchased).length}
              </span>
            </button>
          ))}
        </div>

        {usedCategories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {usedCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`transition-all rounded-full ${selectedCategory === cat ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}
              >
                <CategoryBadge category={cat} />
              </button>
            ))}
          </div>
        )}

        {fetching ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-3xl mb-2">{tab === 'purchased' ? '🛍️' : '🛒'}</p>
            <p className="text-sm">
              {tab === 'purchased'
                ? 'Nothing purchased yet.'
                : selectedCategory
                  ? 'No items in this category.'
                  : 'Paste a product URL above to start your wishlist.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(item => (
              <WishlistCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onTogglePurchased={handleTogglePurchased}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
