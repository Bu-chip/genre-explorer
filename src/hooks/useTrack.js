import { useState, useEffect } from 'react'

const LASTFM_KEY = import.meta.env.VITE_LASTFM_API_KEY
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/'
const PROXY = 'https://corsproxy.io/?'
const DEEZER_SEARCH = 'https://api.deezer.com/search'
const ITUNES_SEARCH = 'https://itunes.apple.com/search'

const NON_MUSIC = /\b(podcast|audiobook|interview)\b/i

function isMusical(title) {
  return !!title && !NON_MUSIC.test(title)
}

async function fetchJson(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
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
  const data = await fetchJson(url.toString())
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
  // Deezer is usually not CORS-friendly from the browser; try direct, then proxy.
  let data = await fetchJson(url)
  if (!data) data = await fetchJson(`${PROXY}${encodeURIComponent(url)}`)
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
  const data = await fetchJson(url)
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
