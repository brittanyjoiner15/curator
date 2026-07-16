export function register() {
  // no-op: exists so Next.js loads this file and wires up onRequestError
}

export const onRequestError = async (
  err: unknown,
  request: { headers: { cookie?: string | string[] } }
) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = await import('./lib/posthog-server')
    const posthog = getPostHogServer()

    // Pull the PostHog distinct_id out of the SDK cookie so the error ties to the user
    let distinctId: string | undefined
    if (request.headers.cookie) {
      const cookieString = Array.isArray(request.headers.cookie)
        ? request.headers.cookie.join('; ')
        : request.headers.cookie
      const match = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/)
      if (match?.[1]) {
        try {
          distinctId = JSON.parse(decodeURIComponent(match[1])).distinct_id
        } catch {
          // unparseable cookie — capture the error without a distinct_id
        }
      }
    }

    await posthog.captureException(err, distinctId)
  }
}
