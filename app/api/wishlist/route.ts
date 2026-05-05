import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'
import { scrapeProduct } from '@/lib/product'
import { analyzeProduct } from '@/lib/claude'

const WISHLIST_CATEGORIES = ['clothes', 'tech', 'business', 'camper', 'home', 'pets']

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const url: string = body?.url?.trim()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('url', url)
    .eq('user_id', auth.userId)
    .single()

  if (existing) return NextResponse.json({ error: 'Already in your wishlist' }, { status: 409 })

  let metadata: { title: string; description: string; thumbnail_url: string | null; price: string | null }
  try {
    metadata = await scrapeProduct(url)
  } catch {
    metadata = { title: url, description: '', thumbnail_url: null, price: null }
  }

  let category = 'other'
  if (auth.anthropicApiKey) {
    try {
      const result = await analyzeProduct({
        title: metadata.title,
        description: metadata.description,
        apiKey: auth.anthropicApiKey,
        categories: WISHLIST_CATEGORIES,
      })
      if (WISHLIST_CATEGORIES.includes(result.category)) {
        category = result.category
      }
    } catch {}
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      url,
      user_id: auth.userId,
      title: metadata.title,
      description: metadata.description,
      thumbnail_url: metadata.thumbnail_url,
      price: metadata.price,
      category,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
