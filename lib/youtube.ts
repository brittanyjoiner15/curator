export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2]
      return u.searchParams.get('v')
    }
  } catch {}
  return null
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 1
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  return Math.max(1, Math.ceil(h * 60 + m + s / 60))
}

export async function fetchYouTubeMetadata(videoId: string) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
  )
  const data = await res.json()
  if (!data.items?.length) throw new Error('Video not found')

  const item = data.items[0]
  return {
    title: item.snippet.title as string,
    description: (item.snippet.description as string).slice(0, 500),
    thumbnail_url: (item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url) as string,
    duration_minutes: parseDuration(item.contentDetails.duration),
  }
}
