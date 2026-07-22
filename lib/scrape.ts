import * as cheerio from 'cheerio'
import { fetchJina } from './jina'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Curator/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

const PRICE_RE = /[\$£€¥₹]\s*[\d,]+(?:\.\d{2})?|[\d,]+(?:\.\d{2})?\s*[\$£€¥₹]/

export async function scrapeUrl(url: string) {
  // Jina Reader is the primary text source (renders JS, bypasses bot blocks).
  // The raw HTML fetch feeds cheerio for metadata (og tags, price) and text fallback.
  const [jina, html] = await Promise.all([
    fetchJina(url),
    fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) })
      .then(res => (res.ok ? res.text() : null))
      .catch(() => null),
  ])
  if (!jina && html === null) throw new Error('Failed to fetch page')

  let title = ''
  let description = ''
  let thumbnail_url: string | null = null
  let price: string | null = null
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

    // Price: meta → JSON-LD → DOM (before stripping nav/scripts).
    // Intentionally cheerio-only: /api/add uses price to classify product vs
    // content, and regexing Jina markdown would misfire on articles.
    const metaAmount =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="og:price:amount"]').attr('content')
    if (metaAmount) {
      const currency =
        $('meta[property="product:price:currency"]').attr('content') ||
        $('meta[property="og:price:currency"]').attr('content') ||
        '$'
      price = `${currency}${metaAmount}`
    }

    if (!price) {
      $('script[type="application/ld+json"]').each((_, el) => {
        if (price) return
        try {
          const data = JSON.parse($(el).html() || '')
          const entries = Array.isArray(data) ? data : [data]
          for (const entry of entries) {
            const offers = entry?.offers
            if (!offers) continue
            const offer = Array.isArray(offers) ? offers[0] : offers
            if (offer?.price != null) {
              price = `${offer?.priceCurrency || '$'}${offer.price}`
              break
            }
          }
        } catch {}
      })
    }

    if (!price) {
      $('[class*="price"], [data-price], [id*="price"]').each((_, el) => {
        if (price) return
        const text = $(el).text().trim().replace(/\s+/g, ' ')
        const match = text.match(PRICE_RE)
        if (match) price = match[0]
      })
    }

    // Text fallback for when Jina is unavailable
    $('script, style, nav, header, footer, aside, [class*="sidebar"], [class*="menu"], [class*="ad-"], [id*="nav"]').remove()
    const articleEl = $('article, [role="main"], main, .post-content, .article-body, .entry-content').first()
    cheerioText = (articleEl.length ? articleEl : $('body')).text()
  }

  const text = (jina?.content || cheerioText).replace(/\s+/g, ' ').trim()
  const wordCount = text.split(' ').filter(Boolean).length
  const duration_minutes = Math.max(1, Math.ceil(wordCount / 200))

  return {
    title: (title || jina?.title || '').trim(),
    description: (description || jina?.description || '').trim(),
    thumbnail_url,
    price,
    text: text.slice(0, 3000),
    duration_minutes,
  }
}
