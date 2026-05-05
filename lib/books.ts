export interface BookSearchResult {
  id: string
  title: string
  authors: string[]
  description: string
  cover_url: string | null
  published_year: number | null
  isbn_13: string | null
  isbn_10: string | null
  page_count: number | null
}

export async function searchBooks(query: string, apiKey?: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({ q: query, maxResults: '8' })
  if (apiKey) params.set('key', apiKey)

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`)
  if (!res.ok) return []
  const data = await res.json()

  return (data.items ?? []).map((item: any) => {
    const info = item.volumeInfo ?? {}
    const isbns: { type: string; identifier: string }[] = info.industryIdentifiers ?? []
    const isbn13 = isbns.find(i => i.type === 'ISBN_13')?.identifier ?? null
    const isbn10 = isbns.find(i => i.type === 'ISBN_10')?.identifier ?? null

    const publishedYear = info.publishedDate
      ? parseInt(info.publishedDate.slice(0, 4), 10) || null
      : null

    const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null
    const cover_url = thumbnail ? thumbnail.replace('http://', 'https://') : null

    return {
      id: item.id as string,
      title: info.title ?? 'Unknown',
      authors: info.authors ?? [],
      description: info.description ?? '',
      cover_url,
      published_year: publishedYear,
      isbn_13: isbn13,
      isbn_10: isbn10,
      page_count: info.pageCount ?? null,
    }
  })
}
