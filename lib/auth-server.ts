import { NextRequest } from 'next/server'
import { createServiceClient } from './supabase'

export interface AuthUser {
  userId: string
  anthropicApiKey: string | null
  categories: string[]
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const supabase = createServiceClient()

  // Web app: Authorization: Bearer <supabase-jwt>
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (user) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('anthropic_api_key, categories')
        .eq('user_id', user.id)
        .single()
      return {
        userId: user.id,
        anthropicApiKey: settings?.anthropic_api_key ?? null,
        categories: settings?.categories ?? [],
      }
    }
  }

  // External tools: x-api-token: <personal-token>
  const apiToken = req.headers.get('x-api-token')
  if (apiToken) {
    const { data } = await supabase
      .from('user_settings')
      .select('user_id, anthropic_api_key, categories')
      .eq('api_token', apiToken)
      .single()
    if (data) {
      return {
        userId: data.user_id,
        anthropicApiKey: data.anthropic_api_key,
        categories: data.categories ?? [],
      }
    }
  }

  return null
}
