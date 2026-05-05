'use client'

import Image from 'next/image'
import { WatchItem } from '@/types'

const SERVICE_COLORS: Record<string, string> = {
  'Netflix':        'bg-red-100 text-red-700',
  'Hulu':           'bg-green-100 text-green-700',
  'Disney+':        'bg-blue-100 text-blue-700',
  'Max':            'bg-purple-100 text-purple-700',
  'HBO Max':        'bg-purple-100 text-purple-700',
  'Prime Video':    'bg-sky-100 text-sky-700',
  'Apple TV+':      'bg-gray-100 text-gray-700',
  'Peacock':        'bg-yellow-100 text-yellow-700',
  'Paramount+':     'bg-blue-100 text-blue-700',
}

function ServiceBadge({ name }: { name: string }) {
  const color = SERVICE_COLORS[name] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {name}
    </span>
  )
}

export function WatchCard({
  item,
  onDelete,
  onToggleWatched,
}: {
  item: WatchItem
  onDelete?: (id: string) => void
  onToggleWatched?: (id: string, watched: boolean) => void
}) {
  return (
    <div className={`flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-opacity ${item.watched ? 'opacity-60' : ''}`}>
      {item.poster_url ? (
        <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={item.poster_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      ) : (
        <div className="w-14 h-20 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
          🎬
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm font-semibold text-gray-900 leading-tight ${item.watched ? 'line-through' : ''}`}>
              {item.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
              {item.release_year ? ` · ${item.release_year}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleWatched && (
              <button
                onClick={() => onToggleWatched(item.id, !item.watched)}
                title={item.watched ? 'Mark unwatched' : 'Mark watched'}
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

        {item.streaming_services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.streaming_services.slice(0, 3).map(s => (
              <ServiceBadge key={s} name={s} />
            ))}
            {item.streaming_services.length > 3 && (
              <span className="text-xs text-gray-400">+{item.streaming_services.length - 3} more</span>
            )}
          </div>
        )}

        {item.streaming_services.length === 0 && (
          <span className="text-xs text-gray-400">No streaming info</span>
        )}
      </div>
    </div>
  )
}
