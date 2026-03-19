import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('content_items').select('topics')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const topics = [...new Set((data ?? []).flatMap(row => row.topics as string[]))].sort()
  return NextResponse.json(topics)
}
