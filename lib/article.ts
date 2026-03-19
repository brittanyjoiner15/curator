import * as cheerio from 'cheerio'

export async function scrapeArticle(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Curator/1.0)' },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    $('h1').first().text()

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''

  const thumbnail_url =
    $('meta[property="og:image"]').attr('content') || null

  // Strip noise
  $('script, style, nav, header, footer, aside, [class*="sidebar"], [class*="menu"], [class*="ad-"], [id*="nav"]').remove()

  // Prefer semantic article containers
  const articleEl = $('article, [role="main"], main, .post-content, .article-body, .entry-content').first()
  const rawText = (articleEl.length ? articleEl : $('body')).text()
  const text = rawText.replace(/\s+/g, ' ').trim()

  const wordCount = text.split(' ').filter(Boolean).length
  const duration_minutes = Math.max(1, Math.ceil(wordCount / 200))

  return {
    title: title.trim(),
    description: description.trim(),
    thumbnail_url,
    text: text.slice(0, 3000),
    duration_minutes,
  }
}
