import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const maxMinutes = parseInt(searchParams.get('max_minutes') || '60')
  const topicsParam = searchParams.get('topics')
  const topics = topicsParam ? topicsParam.split(',').filter(Boolean) : []

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('user_id', auth.userId)
    .lte('duration_minutes', maxMinutes)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ item: null })

  const pool = topics.length
    ? data.filter(item => topics.some(t => (item.topics as string[]).includes(t)))
    : data

  if (!pool.length) return NextResponse.json({ item: null })

  const item = pool[Math.floor(Math.random() * pool.length)]
  return NextResponse.json({ item })
}
