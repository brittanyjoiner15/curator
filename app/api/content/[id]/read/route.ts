import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'
import { fetchArticleFullText } from '@/lib/article'
import { captureServerException } from '@/lib/posthog-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()
  const { data: item, error } = await supabase
    .from('content_items')
    .select('url, type')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single()

  if (error || !item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (item.type !== 'article') {
    return NextResponse.json({ error: 'Only articles support in-app reading' }, { status: 400 })
  }

  try {
    const { content, source } = await fetchArticleFullText(item.url)
    if (!content) return NextResponse.json({ error: 'Could not extract article content' }, { status: 502 })
    return NextResponse.json({ content, source })
  } catch (err) {
    captureServerException(err instanceof Error ? err : new Error(String(err)), auth.userId, { route: '/api/content/[id]/read' })
    return NextResponse.json({ error: 'Could not extract article content' }, { status: 502 })
  }
}
