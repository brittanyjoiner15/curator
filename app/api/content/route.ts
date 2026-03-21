import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'
import { getYouTubeVideoId, fetchYouTubeMetadata } from '@/lib/youtube'
import { scrapeArticle } from '@/lib/article'
import { analyzeContent } from '@/lib/claude'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!auth.anthropicApiKey) {
    return NextResponse.json(
      { error: 'No Anthropic API key set. Visit /settings to add one.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const url: string = body?.url?.trim()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  const fallbackTitle: string | undefined = typeof body.title === 'string' ? body.title.trim() : undefined

  const supabase = createServiceClient()

  // Duplicate check (per user)
  const { data: existing } = await supabase
    .from('content_items')
    .select('id')
    .eq('url', url)
    .eq('user_id', auth.userId)
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
    metadata = type === 'youtube'
      ? await fetchYouTubeMetadata(videoId!)
      : await scrapeArticle(url)
  } catch {
    if (fallbackTitle) {
      metadata = { title: fallbackTitle, description: '', thumbnail_url: null, duration_minutes: 0 }
    } else {
      return NextResponse.json({ error: 'Failed to fetch content. Provide a "title" field to save anyway.' }, { status: 422 })
    }
  }

  let topics: string[]
  try {
    const result = await analyzeContent({
      type,
      title: metadata.title,
      description: metadata.description,
      text: metadata.text,
      apiKey: auth.anthropicApiKey,
      categories: auth.categories.length ? auth.categories : undefined,
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
      user_id: auth.userId,
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
