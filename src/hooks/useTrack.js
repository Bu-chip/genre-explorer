import { useState, useEffect } from 'react'
import { deezerProxyUrl } from '../config'

const LASTFM_KEY = import.meta.env.VITE_LASTFM_API_KEY
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/'
const DEEZER_SEARCH = 'https://api.deezer.com/search'
const ITUNES_SEARCH = 'https://itunes.apple.com/search'

const NON_MUSIC = /\b(podcast|audiobook|interview)\b/i

function isMusical(title) {
  return !!title && !NON_MUSIC.test(title)
}

// `warn` logs failures to the console. Leave it off for requests that are
// expected to fail, like direct (un-proxied) Deezer calls blocked by CORS.
async function fetchJson(url, { warn = false } = {}) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      if (warn) {
        console.warn(`[useTrack] fetch responded ${res.status} ${res.statusText} for ${url}`)
      }
      return null
    }
    return await res.json()
  } catch (err) {
    if (warn) {
      console.warn(`[useTrack] fetch failed for ${url}:`, err)
    }
    return null
  }
}

async function fetchLastfmTopTrack(genre) {
  if (!LASTFM_KEY) return null
  const url = new URL(LASTFM_BASE)
  url.search = new URLSearchParams({
    method: 'tag.gettoptracks',
    tag: genre,
    api_key: LASTFM_KEY,
    format: 'json',
    limit: '5',
  })
  const data = await fetchJson(url.toString(), { warn: true })
  const tracks = data?.tracks?.track
  if (!Array.isArray(tracks)) return null
  for (const t of tracks) {
    if (isMusical(t.name)) {
      return { artist: t.artist?.name, title: t.name }
    }
  }
  return null
}

async function fetchDeezerByGenre(genre) {
  const url = `${DEEZER_SEARCH}?q=${encodeURIComponent(genre)}&limit=5`
  // Deezer is usually not CORS-friendly from the browser; try direct, then
  // proxy via our Cloudflare Worker.
  let data = await fetchJson(url)
  if (!data) data = await fetchJson(deezerProxyUrl(url), { warn: true })
  const items = data?.data
  if (!Array.isArray(items)) return null
  for (const t of items) {
    if (isMusical(t.title)) {
      return { artist: t.artist?.name, title: t.title }
    }
  }
  return null
}

async function fetchItunesByGenre(genre) {
  const url = `${ITUNES_SEARCH}?term=${encodeURIComponent(genre)}&entity=song&limit=5`
  const data = await fetchJson(url, { warn: true })
  const items = data?.results
  if (!Array.isArray(items)) return null
  for (const t of items) {
    if (isMusical(t.trackName)) {
      return { artist: t.artistName, title: t.trackName }
    }
  }
  return null
}

export function useTrack(genreName) {
  const [track, setTrack] = useState(null)

  useEffect(() => {
    if (!genreName) {
      setTrack(null)
      return
    }
    let cancelled = false
    setTrack(null)

    async function run() {
      const lastfm = await fetchLastfmTopTrack(genreName)
      if (cancelled) return
      if (lastfm) { setTrack(lastfm); return }

      const deezer = await fetchDeezerByGenre(genreName)
      if (cancelled) return
      if (deezer) { setTrack(deezer); return }

      const itunes = await fetchItunesByGenre(genreName)
      if (cancelled) return
      if (itunes) { setTrack(itunes); return }
    }
    run()

    return () => { cancelled = true }
  }, [genreName])

  return track
}
