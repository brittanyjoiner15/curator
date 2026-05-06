const ENDPOINT = 'https://api.hardcover.app/v1/graphql'

async function gql<T = any>(
  query: string,
  variables: Record<string, unknown>,
  apiKey: string
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

// Typesense results can come back as { hits: [{ document: {...} }] } or as an array directly
function extractHits(results: unknown): any[] {
  if (!results) return []
  if (Array.isArray(results)) return results
  const r = results as any
  if (Array.isArray(r.hits)) return r.hits.map((h: any) => h.document ?? h)
  return []
}

export async function findHardcoverBook(
  isbn13: string | null,
  isbn10: string | null,
  title: string,
  apiKey: string
): Promise<{ bookId: number; slug: string } | null> {
  const isbn = isbn13 ?? isbn10
  const query = isbn ?? title

  const data = await gql<any>(`
    query SearchBook($query: String!) {
      search(query: $query, query_type: "Book", per_page: 5) {
        results
      }
    }
  `, { query }, apiKey)

  const hits = extractHits(data?.data?.search?.results)
  if (!hits.length) return null

  if (isbn) {
    for (const doc of hits) {
      const isbns: string[] = doc.isbns ?? []
      const cleanIsbn = (s: string) => s.replace(/[-\s]/g, '')
      if (isbns.some(i => cleanIsbn(i) === cleanIsbn(isbn13 ?? '') || cleanIsbn(i) === cleanIsbn(isbn10 ?? ''))) {
        const bookId = parseInt(doc.id, 10)
        if (bookId && doc.slug) return { bookId, slug: doc.slug }
      }
    }
  }

  // Fall back to first search result
  const first = hits[0]
  const bookId = first?.id ? parseInt(first.id, 10) : null
  if (bookId && first?.slug) return { bookId, slug: first.slug }
  return null
}

// Hardcover platform_id 8 = ISBN. Same call the hardcover.app web form makes.
export async function createHardcoverBook(
  isbn: string,
  apiKey: string
): Promise<{ bookId: number; slug: string } | null> {
  const data = await gql<any>(`
    mutation CreateBook($externalId: String!, $platformId: Int!) {
      upsert_book(book: { platform_id: $platformId, external_id: $externalId }) {
        errors
        book {
          id
          slug
        }
      }
    }
  `, { externalId: isbn.replace(/[-\s]/g, ''), platformId: 8 }, apiKey)

  const result = data?.data?.upsert_book
  const id = result?.book?.id
  const slug = result?.book?.slug
  if (id && slug) return { bookId: parseInt(String(id), 10), slug }
  return null
}

export async function addToWantToRead(
  bookId: number,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const data = await gql<any>(`
    mutation AddToWantToRead($bookId: Int!) {
      insert_user_book(object: { book_id: $bookId, status_id: 1 }) {
        id
      }
    }
  `, { bookId }, apiKey)

  if (data?.data?.insert_user_book?.id) return { success: true }

  const error = data?.errors?.[0]?.message ?? 'Failed to add to Hardcover'
  return { success: false, error }
}

export async function syncBookToHardcover({
  title,
  isbn13,
  isbn10,
  apiKey,
}: {
  title: string
  isbn13: string | null
  isbn10: string | null
  apiKey: string
}): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    let book = await findHardcoverBook(isbn13, isbn10, title, apiKey)
    if (!book) {
      const isbn = isbn13 ?? isbn10
      if (isbn) book = await createHardcoverBook(isbn, apiKey)
    }
    if (!book) {
      return { success: false, error: 'Book not found on Hardcover. You can add it manually at hardcover.app.' }
    }
    const result = await addToWantToRead(book.bookId, apiKey)
    return { ...result, slug: book.slug }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
