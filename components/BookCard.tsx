'use client'

import Image from 'next/image'
import { BookItem } from '@/types'

export function BookCard({
  item,
  onDelete,
  onToggleRead,
}: {
  item: BookItem
  onDelete?: (id: string) => void
  onToggleRead?: (id: string, read: boolean) => void
}) {
  return (
    <div className={`flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-opacity ${item.read ? 'opacity-60' : ''}`}>
      {item.cover_url ? (
        <div className="relative w-12 h-18 shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ width: 48, height: 72 }}>
          <Image
            src={item.cover_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-2xl" style={{ width: 48, height: 72 }}>
          📖
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm font-semibold text-gray-900 leading-tight ${item.read ? 'line-through' : ''}`}>
              {item.title}
            </p>
            {item.authors.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.authors.join(', ')}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              {item.published_year ?? ''}
              {item.page_count ? `${item.published_year ? ' · ' : ''}${item.page_count} pages` : ''}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleRead && (
              <button
                onClick={() => onToggleRead(item.id, !item.read)}
                title={item.read ? 'Mark unread' : 'Mark read'}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                title="Remove"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {(item.isbn_13 || item.isbn_10) && (
            <p className="text-xs text-gray-400">
              ISBN: {item.isbn_13 ?? item.isbn_10}
            </p>
          )}
          {item.hardcover_slug && (
            <a
              href={`https://hardcover.app/books/${item.hardcover_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-600 hover:underline"
            >
              View on Hardcover
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
