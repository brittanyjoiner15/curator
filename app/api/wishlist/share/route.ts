import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('wishlist_share_token')
    .eq('user_id', auth.userId)
    .single()

  if (error || !data?.wishlist_share_token) {
    return NextResponse.json({ error: 'Could not get share token' }, { status: 500 })
  }

  return NextResponse.json({ token: data.wishlist_share_token })
}
