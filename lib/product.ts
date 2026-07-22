import * as cheerio from 'cheerio'
import { fetchJina } from './jina'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Curator/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

const PRICE_RE = /[\$£€¥₹]\s*[\d,]+(?:\.\d{2})?|[\d,]+(?:\.\d{2})?\s*[\$£€¥₹]/

export async function scrapeProduct(url: string) {
  const html = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(10000),
  })
    .then(res => (res.ok ? res.text() : null))
    .catch(() => null)

  let title = ''
  let description = ''
  let thumbnail_url: string | null = null
  let price: string | null = null

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

    // 1. Meta tags
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

    // 2. JSON-LD structured data
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
              const currency = offer?.priceCurrency || '$'
              price = `${currency}${offer.price}`
              break
            }
          }
        } catch {}
      })
    }

    // 3. Common DOM price patterns
    if (!price) {
      $('[class*="price"], [data-price], [id*="price"]').each((_, el) => {
        if (price) return
        const text = $(el).text().trim().replace(/\s+/g, ' ')
        const match = text.match(PRICE_RE)
        if (match) price = match[0]
      })
    }
  }

  // Jina Reader fallback for bot-blocked or JS-rendered product pages
  if (html === null || !title.trim() || !price) {
    const jina = await fetchJina(url)
    if (!jina && html === null) throw new Error('Failed to fetch product')
    if (jina) {
      title = title.trim() || jina.title
      description = description.trim() || jina.description
      // This is a known product page, so a price regex on the markdown is safe
      if (!price) price = jina.content.match(PRICE_RE)?.[0] ?? null
    }
  }

  return {
    title: title.trim(),
    description: description.trim(),
    thumbnail_url,
    price,
  }
}
