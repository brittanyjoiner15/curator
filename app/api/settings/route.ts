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
    .select('anthropic_api_key, api_token')
    .eq('user_id', auth.userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    has_anthropic_key: !!data?.anthropic_api_key,
    api_token: data?.api_token,
  })
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServiceClient()

  const updates: Record<string, string> = {}
  if (typeof body.anthropic_api_key === 'string' && body.anthropic_api_key.trim()) {
    updates.anthropic_api_key = body.anthropic_api_key.trim()
  }
  if (body.regenerate_token) {
    updates.api_token = crypto.randomBytes(32).toString('hex')
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
