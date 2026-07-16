import { PostHog } from 'posthog-node'

let client: PostHog | null = null

export function getPostHogServer(): PostHog {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      // API routes can be short-lived, so send events immediately instead of batching
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

export function captureServerException(
  error: unknown,
  distinctId?: string,
  properties?: Record<string, unknown>
) {
  const err = error instanceof Error ? error : new Error(String(error))
  getPostHogServer().captureException(err, distinctId, properties)
}
