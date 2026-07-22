import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'
import { captureServerException, getPostHogServer } from '@/lib/posthog-server'
import { serverLog } from '@/lib/server-logs'
import { getYouTubeVideoId, fetchYouTubeMetadata, isVideoUrl } from '@/lib/youtube'
import { scrapeArticle } from '@/lib/article'
import { scrapeUrl } from '@/lib/scrape'
import { analyzeContent, analyzeProduct, classifyUrl } from '@/lib/claude'

const WISHLIST_CATEGORIES = ['clothes', 'tech', 'business', 'camper', 'home', 'pets']

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const url: string = body?.url?.trim()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const supabase = createServiceClient()

  // YouTube and direct video URLs are always content
  const videoId = getYouTubeVideoId(url)
  const isVideo = !videoId && isVideoUrl(url)

  if (videoId || isVideo) {
    const { data: existing } = await supabase
      .from('content_items')
      .select('id')
      .eq('url', url)
      .eq('user_id', auth.userId)
      .single()
    if (existing) return NextResponse.json({ error: 'Already in your library' }, { status: 409 })

    let metadata: { title: string; description: string; thumbnail_url: string | null; duration_minutes: number; text?: string; scrape_source?: string }
    try {
      metadata = videoId ? await fetchYouTubeMetadata(videoId) : await scrapeArticle(url)
    } catch (err) {
      serverLog.warn('Video metadata fetch failed, falling back to URL as title', { route: '/api/add', url, error: String(err), posthogDistinctId: auth.userId })
      metadata = { title: url, description: '', thumbnail_url: null, duration_minutes: 5 }
    }

    // YouTube metadata comes from the API, not a scrape, so only track scraped videos
    if (!videoId) {
      getPostHogServer().capture({
        distinctId: auth.userId,
        event: 'url_scraped',
        properties: { route: '/api/add', url, source: metadata.scrape_source ?? 'failed' },
      })
    }

    const type = videoId ? 'youtube' : 'video'
    let topics: string[] = []
    if (auth.anthropicApiKey) {
      try {
        const result = await analyzeContent({ type, title: metadata.title, description: metadata.description, text: metadata.text, apiKey: auth.anthropicApiKey, categories: auth.categories.length ? auth.categories : undefined })
        topics = result.topics
      } catch (err) {
        serverLog.warn('AI content analysis failed, saving without topics', { route: '/api/add', url, error: String(err), posthogDistinctId: auth.userId })
      }
    }

    const { data, error } = await supabase
      .from('content_items')
      .insert({ url, type, user_id: auth.userId, title: metadata.title, description: metadata.description, thumbnail_url: metadata.thumbnail_url, duration_minutes: metadata.duration_minutes, topics })
      .select().single()

    if (error) {
      captureServerException(new Error(error.message), auth.userId, { route: '/api/add' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ type: 'content', item: data }, { status: 201 })
  }

  // For everything else, scrape and classify
  let scraped: Awaited<ReturnType<typeof scrapeUrl>>
  try {
    scraped = await scrapeUrl(url)
  } catch (err) {
    serverLog.warn('URL scrape failed, falling back to URL as title', { route: '/api/add', url, error: String(err), posthogDistinctId: auth.userId })
    scraped = { title: url, description: '', thumbnail_url: null, price: null, text: '', duration_minutes: 5, scrape_source: 'failed' }
  }

  getPostHogServer().capture({
    distinctId: auth.userId,
    event: 'url_scraped',
    properties: { route: '/api/add', url, source: scraped.scrape_source },
  })

  // Classify: price found → product, else ask Claude, else default content
  let itemType: 'content' | 'product' = 'content'
  if (scraped.price) {
    itemType = 'product'
  } else if (auth.anthropicApiKey) {
    try {
      const result = await classifyUrl({ title: scraped.title, description: scraped.description, apiKey: auth.anthropicApiKey })
      itemType = result.type
    } catch (err) {
      serverLog.warn('AI URL classification failed, defaulting to content', { route: '/api/add', url, error: String(err), posthogDistinctId: auth.userId })
    }
  }

  if (itemType === 'product') {
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('url', url)
      .eq('user_id', auth.userId)
      .single()
    if (existing) return NextResponse.json({ error: 'Already in your wishlist' }, { status: 409 })

    let category = 'other'
    if (auth.anthropicApiKey) {
      try {
        const result = await analyzeProduct({ title: scraped.title, description: scraped.description, apiKey: auth.anthropicApiKey, categories: WISHLIST_CATEGORIES })
        if (WISHLIST_CATEGORIES.includes(result.category)) category = result.category
      } catch (err) {
        serverLog.warn('AI product analysis failed, using default category', { route: '/api/add', url, error: String(err), posthogDistinctId: auth.userId })
      }
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({ url, user_id: auth.userId, title: scraped.title, description: scraped.description, thumbnail_url: scraped.thumbnail_url, price: scraped.price, category })
      .select().single()

    if (error) {
      captureServerException(new Error(error.message), auth.userId, { route: '/api/add' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ type: 'product', item: data }, { status: 201 })
  }

  // Save as content
  const { data: existing } = await supabase
    .from('content_items')
    .select('id')
    .eq('url', url)
    .eq('user_id', auth.userId)
    .single()
  if (existing) return NextResponse.json({ error: 'Already in your library' }, { status: 409 })

  let topics: string[] = []
  if (auth.anthropicApiKey) {
    try {
      const result = await analyzeContent({ type: 'article', title: scraped.title, description: scraped.description, text: scraped.text, apiKey: auth.anthropicApiKey, categories: auth.categories.length ? auth.categories : undefined })
      topics = result.topics
    } catch (err) {
      serverLog.warn('AI content analysis failed, saving without topics', { route: '/api/add', url, error: String(err), posthogDistinctId: auth.userId })
    }
  }

  const { data, error } = await supabase
    .from('content_items')
    .insert({ url, type: 'article', user_id: auth.userId, title: scraped.title, description: scraped.description, thumbnail_url: scraped.thumbnail_url, duration_minutes: scraped.duration_minutes, topics })
    .select().single()

  if (error) {
    captureServerException(new Error(error.message), auth.userId, { route: '/api/add' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ type: 'content', item: data }, { status: 201 })
}
