export interface ContentItem {
  id: string
  url: string
  type: 'article' | 'youtube'
  title: string
  description: string | null
  duration_minutes: number
  topics: string[]
  thumbnail_url: string | null
  created_at: string
  read: boolean
}
