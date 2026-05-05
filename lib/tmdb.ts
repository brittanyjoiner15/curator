const BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/w500'

export interface TmdbSearchResult {
  id: number
  media_type: 'movie' | 'tv'
  title: string
  overview: string
  poster_url: string | null
  release_year: number | null
}

export async function searchMulti(query: string, apiKey: string): Promise<TmdbSearchResult[]> {
  const res = await fetch(
    `${BASE}/search/multi?query=${encodeURIComponent(query)}&api_key=${apiKey}&include_adult=false`
  )
  if (!res.ok) return []
  const data = await res.json()

  return (data.results ?? [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 8)
    .map((r: any) => ({
      id: r.id,
      media_type: r.media_type as 'movie' | 'tv',
      title: r.title ?? r.name ?? 'Unknown',
      overview: r.overview ?? '',
      poster_url: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
      release_year: r.release_date
        ? new Date(r.release_date).getFullYear()
        : r.first_air_date
          ? new Date(r.first_air_date).getFullYear()
          : null,
    }))
}

export async function getStreamingServices(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  apiKey: string,
  region = 'US'
): Promise<string[]> {
  const res = await fetch(
    `${BASE}/${mediaType}/${tmdbId}/watch/providers?api_key=${apiKey}`
  )
  if (!res.ok) return []
  const data = await res.json()

  const regionData = data.results?.[region]
  if (!regionData) return []

  const flatrate: string[] = (regionData.flatrate ?? []).map((p: any) => p.provider_name as string)
  const free: string[]     = (regionData.free ?? []).map((p: any) => p.provider_name as string)

  return [...new Set([...flatrate, ...free])]
}
