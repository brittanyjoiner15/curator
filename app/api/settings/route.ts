import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('anthropic_api_key, api_token, categories, hardcover_api_key')
    .eq('user_id', auth.userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    has_anthropic_key: !!data?.anthropic_api_key,
    has_hardcover_key: !!data?.hardcover_api_key,
    api_token: data?.api_token,
    categories: data?.categories ?? [],
  })
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServiceClient()

  const updates: Record<string, unknown> = {}
  if (typeof body.anthropic_api_key === 'string' && body.anthropic_api_key.trim()) {
    updates.anthropic_api_key = body.anthropic_api_key.trim()
  }
  if (typeof body.hardcover_api_key === 'string' && body.hardcover_api_key.trim()) {
    updates.hardcover_api_key = body.hardcover_api_key.trim()
  }
  if (body.regenerate_token) {
    updates.api_token = crypto.randomBytes(32).toString('hex')
  }
  if (Array.isArray(body.categories)) {
    updates.categories = body.categories.map((c: unknown) => String(c).trim()).filter(Boolean)
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', auth.userId)
    .select('api_token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, api_token: data?.api_token })
}
