import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'
import { captureServerException } from '@/lib/posthog-server'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('topics')
    .eq('user_id', auth.userId)

  if (error) {
    captureServerException(new Error(error.message), auth.userId, { route: '/api/topics' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const topics = [...new Set((data ?? []).flatMap(row => row.topics as string[]))].sort()
  return NextResponse.json(topics)
}
