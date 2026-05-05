import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { searchBooks } from '@/lib/books'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query) return NextResponse.json([])

  const results = await searchBooks(query, process.env.GOOGLE_BOOKS_API_KEY)
  return NextResponse.json(results)
}
