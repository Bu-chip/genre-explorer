import { deezerProxyUrl } from '../config'

const DEEZER_SEARCH = 'https://api.deezer.com/search'
const ITUNES_SEARCH = 'https://itunes.apple.com/search'

const NON_MUSIC = /\b(podcast|audiobook|interview)\b/i

function isMusical(title) {
  return !!title && !NON_MUSIC.test(title)
}

async function fetchJson(url, { warn = false } = {}) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      if (warn) {
        console.warn(`[artistSearch] fetch responded ${res.status} ${res.statusText} for ${url}`)
      }
      return null
    }
    return await res.json()
  } catch (err) {
    if (warn) {
      console.warn(`[artistSearch] fetch failed for ${url}:`, err)
    }
    return null
  }
}

// Find a playable track for an artist name: Deezer artist search (direct,
// then via the Cloudflare Worker proxy), falling back to iTunes. Always
// searches by artist, never by genre tag. Returns
// { artist, title, preview, cover } or null when nothing playable exists.
export async function fetchTrackByArtist(artistName) {
  const query = `artist:"${artistName}"`
  const url = `${DEEZER_SEARCH}?q=${encodeURIComponent(query)}&limit=10`
  // Deezer is usually not CORS-friendly from the browser; try direct, then
  // proxy via our Cloudflare Worker.
  let data = await fetchJson(url)
  if (!data) data = await fetchJson(deezerProxyUrl(url), { warn: true })
  const items = data?.data
  if (Array.isArray(items)) {
    for (const t of items) {
      if (t.preview && isMusical(t.title)) {
        return {
          artist: t.artist?.name || artistName,
          title: t.title,
          preview: t.preview,
          cover: t.album?.cover_medium || undefined,
        }
      }
    }
  }

  const itunesUrl =
    `${ITUNES_SEARCH}?term=${encodeURIComponent(artistName)}` +
    '&entity=song&attribute=artistTerm&limit=10'
  const itunes = await fetchJson(itunesUrl, { warn: true })
  const results = itunes?.results
  if (Array.isArray(results)) {
    for (const t of results) {
      if (t.previewUrl && isMusical(t.trackName)) {
        return {
          artist: t.artistName,
          title: t.trackName,
          preview: t.previewUrl,
          cover: t.artworkUrl100 || undefined,
        }
      }
    }
  }

  return null
}
