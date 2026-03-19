'use client'

import Image from 'next/image'
import { ContentItem } from '@/types'

const TOPIC_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]

function topicColor(topic: string) {
  let hash = 0
  for (const c of topic) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length]
}

export function TopicBadge({ topic }: { topic: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${topicColor(topic)}`}>
      {topic}
    </span>
  )
}

export function ContentCard({ item, large = false }: { item: ContentItem; large?: boolean }) {
  const durationLabel =
    item.type === 'youtube'
      ? `${item.duration_minutes} min video`
      : `${item.duration_minutes} min read`

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex gap-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${large ? 'flex-col' : ''}`}
    >
      {item.thumbnail_url && (
        <div className={`relative shrink-0 bg-gray-100 ${large ? 'w-full h-48' : 'w-24 h-24 sm:w-32 sm:h-32'}`}>
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover"
            unoptimized
          />
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {item.type === 'youtube' ? '▶' : '📄'} {item.duration_minutes}m
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3 min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
          {item.type === 'youtube' ? 'YouTube' : 'Article'} · {durationLabel}
        </p>
        <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {item.topics.map(t => (
            <TopicBadge key={t} topic={t} />
          ))}
        </div>
      </div>
    </a>
  )
}
