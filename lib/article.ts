import * as cheerio from 'cheerio'
import { fetchJina, type ScrapeSource } from './jina'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Curator/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

// Full article text for the in-app reader (unlike scrapeArticle, not truncated to 3000 chars).
export async function fetchArticleFullText(url: string): Promise<{ content: string; source: ScrapeSource }> {
  const jina = await fetchJina(url)
  if (jina?.content) return { content: jina.content, source: 'jina' }

  const html = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) })
    .then(res => (res.ok ? res.text() : null))
    .catch(() => null)
  if (html === null) return { content: '', source: 'failed' }

  const $ = cheerio.load(html)
  $('script, style, nav, header, footer, aside, [class*="sidebar"], [class*="menu"], [class*="ad-"], [id*="nav"]').remove()
  const articleEl = $('article, [role="main"], main, .post-content, .article-body, .entry-content').first()
  const text = (articleEl.length ? articleEl : $('body')).text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*/g, '\n\n').trim()

  return { content: text, source: text ? 'cheerio' : 'failed' }
}

export async function scrapeArticle(url: string) {
  // Jina Reader is the primary text source (renders JS, bypasses bot blocks).
  // The raw HTML fetch feeds cheerio for metadata (og tags) and text fallback.
  const [jina, html] = await Promise.all([
    fetchJina(url),
    fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) })
      .then(res => (res.ok ? res.text() : null))
      .catch(() => null),
  ])
  if (!jina && html === null) throw new Error('Failed to fetch article')

  let title = ''
  let description = ''
  let thumbnail_url: string | null = null
  let cheerioText = ''

  if (html !== null) {
    const $ = cheerio.load(html)

    title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text()

    description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''

    thumbnail_url = $('meta[property="og:image"]').attr('content') || null

    // Starter Story: prefer transcript content
    const transcript = $('#tab-pane-transcript-right').text().replace(/\s+/g, ' ').trim()
    if (transcript.length > 100) {
      const wordCount = transcript.split(' ').filter(Boolean).length
      const duration_minutes = Math.max(1, Math.ceil(wordCount / 130)) // ~130 wpm speaking pace
      const scrape_source: ScrapeSource = 'cheerio'
      return {
        title: (title || jina?.title || '').trim(),
        description: (description || jina?.description || '').trim(),
        thumbnail_url,
        text: transcript.slice(0, 3000),
        duration_minutes,
        scrape_source,
      }
    }

    // Text fallback for when Jina is unavailable
    $('script, style, nav, header, footer, aside, [class*="sidebar"], [class*="menu"], [class*="ad-"], [id*="nav"]').remove()
    const articleEl = $('article, [role="main"], main, .post-content, .article-body, .entry-content').first()
    cheerioText = (articleEl.length ? articleEl : $('body')).text()
  }

  const text = (jina?.content || cheerioText).replace(/\s+/g, ' ').trim()
  const wordCount = text.split(' ').filter(Boolean).length
  const duration_minutes = Math.max(1, Math.ceil(wordCount / 200))

  const scrape_source: ScrapeSource = jina ? 'jina' : 'cheerio'

  return {
    title: (title || jina?.title || '').trim(),
    description: (description || jina?.description || '').trim(),
    thumbnail_url,
    text: text.slice(0, 3000),
    duration_minutes,
    scrape_source,
  }
}
