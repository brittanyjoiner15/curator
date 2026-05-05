import * as cheerio from 'cheerio'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Curator/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export async function scrapeProduct(url: string) {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`)

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

  let price: string | null = null

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
    const PRICE_RE = /[\$£€¥₹]\s*[\d,]+(?:\.\d{2})?|[\d,]+(?:\.\d{2})?\s*[\$£€¥₹]/
    $('[class*="price"], [data-price], [id*="price"]').each((_, el) => {
      if (price) return
      const text = $(el).text().trim().replace(/\s+/g, ' ')
      const match = text.match(PRICE_RE)
      if (match) price = match[0]
    })
  }

  return {
    title: title.trim(),
    description: description.trim(),
    thumbnail_url,
    price,
  }
}
