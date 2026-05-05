export interface BookItem {
  id: string
  google_books_id: string
  title: string
  authors: string[]
  description: string | null
  cover_url: string | null
  published_year: number | null
  isbn_13: string | null
  isbn_10: string | null
  page_count: number | null
  hardcover_slug: string | null
  read: boolean
  created_at: string
}

export interface WatchItem {
  id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  overview: string | null
  poster_url: string | null
  release_year: number | null
  streaming_services: string[]
  watched: boolean
  created_at: string
}

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
