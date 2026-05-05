import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { searchMulti, getStreamingServices } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query) return NextResponse.json([])

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TMDB not configured' }, { status: 500 })

  const results = await searchMulti(query, apiKey)

  const withProviders = await Promise.all(
    results.map(async r => ({
      ...r,
      streaming_services: await getStreamingServices(r.id, r.media_type, apiKey),
    }))
  )

  return NextResponse.json(withProviders)
}
