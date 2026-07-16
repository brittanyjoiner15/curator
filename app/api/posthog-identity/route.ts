import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'

// Signs the user's distinct_id for PostHog support widget identity verification.
// The secret token must never reach the client — only the resulting HMAC does.
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = process.env.POSTHOG_SECRET_API_TOKEN
  if (!secret) return NextResponse.json({ enabled: false })

  const hash = crypto.createHmac('sha256', secret).update(auth.userId).digest('hex')
  return NextResponse.json({ enabled: true, distinct_id: auth.userId, hash })
}
