export interface WishlistItem {
  id: string
  url: string
  title: string
  description: string | null
  price: string | null
  category: string
  thumbnail_url: string | null
  created_at: string
  purchased: boolean
}

export interface ContentItem {
  id: string
  url: string
  type: 'article' | 'youtube' | 'video'
  title: string
  description: string | null
  duration_minutes: number
  topics: string[]
  thumbnail_url: string | null
  created_at: string
  read: boolean
}
