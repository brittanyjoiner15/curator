import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('book_items')
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
  const { google_books_id, title, authors, description, cover_url, published_year, isbn_13, isbn_10, page_count } = body

  if (!google_books_id || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('book_items')
    .upsert({
      user_id: auth.userId,
      google_books_id,
      title,
      authors: authors ?? [],
      description: description ?? null,
      cover_url: cover_url ?? null,
      published_year: published_year ?? null,
      isbn_13: isbn_13 ?? null,
      isbn_10: isbn_10 ?? null,
      page_count: page_count ?? null,
    }, { onConflict: 'user_id,google_books_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
