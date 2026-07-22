export interface JinaResult {
  title: string
  description: string
  content: string
}

// Fetch a page through Jina Reader (r.jina.ai). Renders JS and bypasses most
// bot blocking. Returns null on any failure so callers can fall back to a raw fetch.
export async function fetchJina(url: string): Promise<JinaResult | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (process.env.JINA_API_KEY) {
      headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`
    }

    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null

    const json = await res.json()
    const data = json?.data
    if (!data?.content) return null

    return {
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      content: String(data.content),
    }
  } catch {
    return null
  }
}
