'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ContentItem } from '@/types'
import { getYouTubeVideoId } from '@/lib/youtube'

export function ContentViewer({
  item,
  accessToken,
  onClose,
  onToggleRead,
}: {
  item: ContentItem
  accessToken: string
  onClose: () => void
  onToggleRead: (id: string, read: boolean) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [articleContent, setArticleContent] = useState<string | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState(false)

  const isArticle = item.type === 'article'
  const videoId = item.type === 'youtube' ? getYouTubeVideoId(item.url) : null
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : item.url

  useEffect(() => {
    setLoaded(false)
    setArticleContent(null)
    setArticleError(false)

    if (!isArticle) return

    let cancelled = false
    setArticleLoading(true)
    fetch(`/api/content/${item.id}/read`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => { if (!cancelled) setArticleContent(data.content) })
      .catch(() => { if (!cancelled) setArticleError(true) })
      .finally(() => { if (!cancelled) setArticleLoading(false) })

    return () => { cancelled = true }
  }, [item.id, isArticle, accessToken])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  let hostname = ''
  try { hostname = new URL(item.url).hostname.replace('www.', '') } catch {}

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-1.5 h-14 px-2 sm:px-3 border-b border-gray-100 shrink-0">
        <button
          onClick={onClose}
          title="Close"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900">{item.title}</h2>

        <button
          onClick={() => onToggleRead(item.id, !item.read)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
            item.read
              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {item.read ? '↩ Unread' : '✓ Mark as read'}
        </button>
      </div>

      {isArticle ? (
        <div className="flex-1 overflow-y-auto">
          {articleLoading && (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400 text-sm">
              Fetching article…
            </div>
          )}

          {articleError && (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-gray-500">Couldn&apos;t pull the full text for this one.</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:text-violet-700 font-medium underline text-sm"
              >
                Open the original →
              </a>
            </div>
          )}

          {articleContent && (
            <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{item.title}</h1>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                {hostname} ↗
              </a>
              <div className="prose prose-gray prose-headings:font-semibold prose-a:text-violet-600 max-w-none mt-6">
                <ReactMarkdown>{articleContent}</ReactMarkdown>
              </div>
            </article>
          )}
        </div>
      ) : (
        <>
          {!videoId && (
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex items-center justify-between gap-3 shrink-0">
              <span>Not loading? Some sites block being shown inside another app.</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium shrink-0"
              >
                Open in new tab
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          )}

          <div className="flex-1 relative bg-gray-50">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                Loading…
              </div>
            )}
            <iframe
              key={item.id}
              src={embedUrl}
              onLoad={() => setLoaded(true)}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </>
      )}
    </div>
  )
}
