'use client'

import Image from 'next/image'
import { WishlistItem } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  clothes:  'bg-pink-100 text-pink-700',
  tech:     'bg-blue-100 text-blue-700',
  business: 'bg-amber-100 text-amber-700',
  camper:   'bg-emerald-100 text-emerald-700',
  home:     'bg-orange-100 text-orange-700',
  pets:     'bg-cyan-100 text-cyan-700',
  other:    'bg-gray-100 text-gray-600',
}

export function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {category}
    </span>
  )
}

export function WishlistCard({
  item,
  onDelete,
  onTogglePurchased,
}: {
  item: WishlistItem
  onDelete?: (id: string) => void
  onTogglePurchased?: (id: string, purchased: boolean) => void
}) {
  return (
    <div className={`group flex gap-3 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${item.purchased ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 min-w-0 flex-1"
      >
        {item.thumbnail_url && (
          <div className="relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-100">
            <Image
              src={item.thumbnail_url}
              alt={item.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5 p-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={item.category} />
            {item.price && (
              <span className="text-sm font-semibold text-emerald-600">{item.price}</span>
            )}
          </div>
          <h3 className={`font-semibold leading-snug group-hover:text-violet-600 transition-colors line-clamp-2 ${item.purchased ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
          )}
        </div>
      </a>

      <div className="flex flex-col justify-center gap-1 pr-3 py-3 shrink-0">
        {onTogglePurchased && (
          <button
            onClick={() => onTogglePurchased(item.id, !item.purchased)}
            title={item.purchased ? 'Mark as not bought' : 'Mark as bought'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-sm"
          >
            {item.purchased ? '↩' : '✓'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            title="Delete"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
