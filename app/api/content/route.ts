import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getYouTubeVideoId, fetchYouTubeMetadata } from '@/lib/youtube'
import { scrapeArticle } from '@/lib/article'
import { analyzeContent } from '@/lib/claude'

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return token === process.env.API_SECRET
}

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const url: string = body?.url?.trim()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const supabase = createServiceClient()

  // Duplicate check
  const { data: existing } = await supabase
    .from('content_items')
    .select('id')
    .eq('url', url)
    .single()

  if (existing) return NextResponse.json({ error: 'Already in your library' }, { status: 409 })

  const videoId = getYouTubeVideoId(url)
  const type = videoId ? 'youtube' : 'article'

  let metadata: {
    title: string
    description: string
    thumbnail_url: string | null
    duration_minutes: number
    text?: string
  }

  try {
    if (type === 'youtube') {
      metadata = await fetchYouTubeMetadata(videoId!)
    } else {
      metadata = await scrapeArticle(url)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch content'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  let topics: string[]
  try {
    const result = await analyzeContent({
      type,
      title: metadata.title,
      description: metadata.description,
      text: metadata.text,
    })
    topics = result.topics
  } catch {
    topics = []
  }

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      url,
      type,
      title: metadata.title,
      description: metadata.description,
      thumbnail_url: metadata.thumbnail_url,
      duration_minutes: metadata.duration_minutes,
      topics,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
