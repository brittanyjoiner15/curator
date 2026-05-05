import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('watch_items')
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
  const { tmdb_id, media_type, title, overview, poster_url, release_year, streaming_services } = body

  if (!tmdb_id || !media_type || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('watch_items')
    .upsert({
      user_id: auth.userId,
      tmdb_id,
      media_type,
      title,
      overview: overview ?? null,
      poster_url: poster_url ?? null,
      release_year: release_year ?? null,
      streaming_services: streaming_services ?? [],
    }, { onConflict: 'user_id,tmdb_id,media_type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
